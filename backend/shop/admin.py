# shop/admin.py

from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from django.contrib.auth.models import User # برای دسترسی به مدل کاربر جنگو

from .models import (
    Category, Slider, Tag, Product, ProductBatch,
    Size, # این خط اضافه شد: import کردن مدل Size
    SizeQuantity, ProductVariant, Review,
    UserProfile, Address, Cart, CartItem, Order, OrderItem, Coupon
)

# ---------------------------------------------------------------------
# اینلاین ها و فرم های مربوط به ProductBatch و ProductVariant
# این بخش از کد شما، منطق خوبی برای مدیریت موجودی و تنوع محصول دارد.
# ---------------------------------------------------------------------

class SizeQuantityInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        total = 0
        for form in self.forms:
            if form.cleaned_data and not form.cleaned_data.get('DELETE', False):
                quantity = form.cleaned_data.get('quantity')
                if quantity is not None: # اطمینان از اینکه quantity وجود دارد
                    total += quantity

        parent_total_quantity = self.instance.total_quantity
        if parent_total_quantity is not None and total != parent_total_quantity:
            raise ValidationError(
                f"خطا: مجموع تعداد سایزها ({total}) باید دقیقاً با تعداد کل بسته ({parent_total_quantity}) برابر باشد. لطفاً تعدادها را بررسی و اصلاح کنید."
            )

class SizeQuantityInline(admin.TabularInline):
    model = SizeQuantity
    extra = 0
    fields = ('size', 'quantity', 'price')
    raw_id_fields = ('size',) # استفاده از raw_id_fields برای انتخاب سایز


class ProductBatchAdminForm(forms.ModelForm):
    class Meta:
        model = ProductBatch
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['total_quantity'].help_text = "تعداد کل بسته (بروزرسانی خودکار با جمع سایزها)"
        else:
            self.fields['total_quantity'].help_text = "تعداد کل بسته (باید با مجموع تعداد سایزها برابر باشد)"

@admin.register(ProductBatch)
class ProductBatchAdmin(admin.ModelAdmin):
    form = ProductBatchAdminForm
    inlines = [SizeQuantityInline]
    list_display = ('product', 'color', 'total_quantity')
    search_fields = ('product__name', 'color')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance

        # منطق بروزرسانی/ایجاد ProductVariant بر اساس SizeQuantity
        for sq in obj.size_quantities.all():
            variant, created = ProductVariant.objects.get_or_create(
                product=obj.product,
                size=sq, # size اینجا یک شی SizeQuantity است
                color=obj.color,
                defaults={'price': sq.price, 'stock': sq.quantity, 'online_stock': sq.quantity} # online_stock را هم در defaults اضافه کردیم
            )
            if not created:
                variant.stock = sq.quantity
                variant.price = sq.price
                # آنلاین استاک را محدود به استاک کل میکنیم (اگر دستی کمتر تنظیم شده باشد)
                variant.online_stock = min(variant.online_stock, sq.quantity)
                variant.save()
            # else: (این بخش دیگر نیازی نیست چون در defaults تنظیم شده)
            #     variant.online_stock = sq.quantity
            #     variant.save()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'fixed_discount_percentage', 'get_active_discount_display', 'created_at']
    list_filter = ['is_active', 'category', 'tags']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('tags',) # برای انتخاب چندتایی تگ ها به شکل بهتر

    # inline برای ProductVariant داخل ProductAdmin
    class ProductVariantInline(admin.TabularInline):
        model = ProductVariant
        extra = 1 # تعداد فیلدهای خالی برای اضافه کردن
        fields = ('size', 'color', 'price', 'stock', 'online_stock') # فیلدهایی که میخواهید نمایش داده شوند
        raw_id_fields = ('size',) # استفاده از raw_id_fields برای انتخاب سایز

    # inline برای Review داخل ProductAdmin
    class ReviewInline(admin.TabularInline):
        model = Review
        extra = 0
        readonly_fields = ('user_name', 'rating', 'comment', 'created_at') # فقط قابل مشاهده باشند
        can_delete = False # اجازه حذف نداشته باشند

    inlines = [ProductVariantInline, ReviewInline] # اضافه کردن اینلاین ها به ProductAdmin

    def get_active_discount_display(self, obj):
        # این متد برای نمایش تخفیف فعال در لیست ادمین
        if obj.is_timed_discount_active():
            return f"{obj.timed_discount_percentage}% (زمان‌دار)"
        if obj.fixed_discount_percentage > 0:
            return f"{obj.fixed_discount_percentage}% (ثابت)"
        return "بدون تخفیف"
    get_active_discount_display.short_description = "تخفیف فعال"

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'display_price', 'stock', 'online_stock', 'is_in_stock')
    list_filter = ('product', 'size', 'color') # اضافه کردن فیلتر رنگ
    search_fields = ('product__name', 'color')
    list_editable = ('online_stock',) # این فیلد را دستی هم بتوان تغییر داد
    raw_id_fields = ('product', 'size') # اضافه کردن raw_id_fields برای product و size

    def save_model(self, request, obj, form, change):
        # این بخش از منطق شما بسیار خوب است، حفظ می‌شود
        if obj.pk:
            old_instance = ProductVariant.objects.get(pk=obj.pk)
            new_online_stock = form.cleaned_data.get('online_stock')
            if new_online_stock is not None and new_online_stock != old_instance.online_stock:
                obj.online_stock = min(new_online_stock, obj.stock) # اطمینان از اینکه آنلاین استاک از کل استاک بیشتر نشود
        super().save_model(request, obj, form, change)

    def display_price(self, obj):
        return f"{int(obj.price):,} تومان"
    display_price.short_description = 'قیمت'

    def is_in_stock(self, obj):
        return obj.online_stock > 0
    is_in_stock.boolean = True
    is_in_stock.short_description = 'موجودی آنلاین'

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at', 'product') # اضافه کردن فیلتر محصول
    search_fields = ('user_name', 'comment', 'product__name')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'image') # اضافه کردن نمایش تصویر
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Slider)
class SliderAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'link') # اضافه کردن نمایش لینک
    list_editable = ('order', 'is_active')


# ----------------------------------------------------
# مدل ادمین های جدید برای مدیریت کاربران، سبد خرید و سفارشات
# ----------------------------------------------------

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone_number']

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'street', 'postal_code', 'recipient_name', 'recipient_phone_number', 'is_default']
    list_filter = ['user', 'province', 'city', 'is_default']
    search_fields = ['user__username', 'city', 'street', 'recipient_name', 'recipient_phone_number']

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['product_variant', 'quantity', 'price_at_addition'] # آیتم‌های سبد خرید معمولاً از طریق API مدیریت می‌شوند نه ادمین
    can_delete = False

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_key', 'created_at', 'updated_at', 'get_total_price_display', 'get_total_items_display']
    list_filter = ['user', 'created_at']
    search_fields = ['user__username', 'session_key']
    inlines = [CartItemInline]

    def get_total_price_display(self, obj):
        return f"{obj.get_total_price():,} تومان"
    get_total_price_display.short_description = "مبلغ کل سبد"

    def get_total_items_display(self, obj):
        return obj.get_total_items()
    get_total_items_display.short_description = "تعداد آیتم"

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_variant', 'quantity', 'price_at_order']
    can_delete = False # آیتم های سفارش بعد از ثبت نباید از ادمین حذف شوند

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'order_date', 'status', 'total_amount', 'shipping_method', 'tracking_code']
    list_filter = ['status', 'order_date', 'shipping_method']
    search_fields = ['user__username', 'tracking_code', 'id']
    date_hierarchy = 'order_date' # برای فیلتر بر اساس تاریخ
    inlines = [OrderItemInline]
    readonly_fields = ['order_date', 'total_amount', 'tracking_code', 'shipping_cost', 'discount_amount'] # اینها توسط سیستم پر می شوند

    # امکان تغییر وضعیت سفارش
    actions = ['mark_as_paid', 'mark_as_processing', 'mark_as_shipped', 'mark_as_delivered', 'mark_as_cancelled']

    def mark_as_paid(self, request, queryset):
        queryset.update(status='paid')
        self.message_user(request, "سفارشات انتخاب شده به وضعیت 'پرداخت شده' تغییر یافتند.")
    mark_as_paid.short_description = "علامت گذاری به عنوان پرداخت شده"

    def mark_as_processing(self, request, queryset):
        queryset.update(status='processing')
        self.message_user(request, "سفارشات انتخاب شده به وضعیت 'در حال آماده‌سازی' تغییر یافتند.")
    mark_as_processing.short_description = "علامت گذاری به عنوان در حال آماده سازی"

    def mark_as_shipped(self, request, queryset):
        queryset.update(status='shipped')
        self.message_user(request, "سفارشات انتخاب شده به وضعیت 'ارسال شده' تغییر یافتند.")
    mark_as_shipped.short_description = "علامت گذاری به عنوان ارسال شده"

    def mark_as_delivered(self, request, queryset):
        queryset.update(status='delivered')
        self.message_user(request, "سفارشات انتخاب شده به وضعیت 'تحویل شده' تغییر یافتند.")
    mark_as_delivered.short_description = "علامت گذاری به عنوان تحویل شده"

    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, "سفارشات انتخاب شده به وضعیت 'لغو شده' تغییر یافتند.")
    mark_as_cancelled.short_description = "علامت گذاری به عنوان لغو شده"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_variant', 'quantity', 'price_at_order']
    list_filter = ['order', 'product_variant']
    search_fields = ['order__id', 'product_variant__product__name']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percentage', 'discount_amount', 'valid_from', 'valid_to', 'is_active', 'usage_limit', 'used_count']
    list_filter = ['is_active', 'valid_from', 'valid_to']
    search_fields = ['code']
    list_editable = ['is_active', 'usage_limit']


# این بلاک اضافه شد: ثبت مدل Size در پنل ادمین
@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ('size', 'order')
    list_editable = ('order',) # امکان ویرایش ترتیب از لیست
    search_fields = ('size',)

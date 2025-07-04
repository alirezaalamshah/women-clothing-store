from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from .models import Category, Slider, Product, ProductVariant, Tag, Review, ProductBatch, SizeQuantity

class SizeQuantityInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        total = 0
        for form in self.forms:
            if form.cleaned_data and not form.cleaned_data.get('DELETE', False):
                quantity = form.cleaned_data.get('quantity')
                if quantity:
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
    formset = SizeQuantityInlineFormSet

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

        for sq in obj.size_quantities.all():
            variant, created = ProductVariant.objects.get_or_create(
                product=obj.product,
                size=sq,
                color=obj.color,
                defaults={'price': sq.price, 'stock': sq.quantity, 'online_stock': sq.quantity}
            )
            if not created:
                variant.stock = sq.quantity
                variant.online_stock = min(variant.online_stock, sq.quantity)
                variant.price = sq.price
                variant.save()

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return form

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active', 'fixed_discount_percentage', 'timed_discount_start_date', 'timed_discount_end_date', 'timed_discount_percentage')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('tags',)

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'display_price', 'stock', 'online_stock', 'is_in_stock')
    list_filter = ('product', 'size')
    search_fields = ('product__name', 'color')
    list_editable = ('online_stock',)

    def save_model(self, request, obj, form, change):
        if obj.pk:
            old_instance = ProductVariant.objects.get(pk=obj.pk)
            new_online_stock = form.cleaned_data.get('online_stock')
            if new_online_stock is not None and new_online_stock != old_instance.online_stock:
                obj.online_stock = min(new_online_stock, obj.stock)
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
    list_filter = ('rating', 'created_at')
    search_fields = ('user_name', 'comment')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Slider)
class SliderAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')
    list_editable = ('order', 'is_active')
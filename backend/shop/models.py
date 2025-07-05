# shop/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
from django.core.exceptions import ValidationError # Import ValidationError
import uuid # For generating tracking_code
from decimal import Decimal

# Helper function for file uploads
def upload_to(instance, filename):
    return 'images/{filename}'.format(filename=filename)

# ----------------------------------------------------
# Core E-commerce Models
# ----------------------------------------------------

class Category(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name="نام دسته بندی")
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True, verbose_name="اسلاگ")
    image = models.ImageField(upload_to=upload_to, blank=True, null=True, verbose_name="تصویر دسته بندی")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "دسته بندی"
        verbose_name_plural = "دسته بندی ها"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

class Slider(models.Model):
    title = models.CharField(max_length=200, verbose_name="عنوان")
    image = models.ImageField(upload_to=upload_to, verbose_name="تصویر")
    link = models.URLField(blank=True, null=True, verbose_name="لینک")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "اسلایدر"
        verbose_name_plural = "اسلایدرها"
        ordering = ['order']

    def __str__(self):
        return self.title

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="نام تگ")
    slug = models.SlugField(max_length=100, unique=True, allow_unicode=True, verbose_name="اسلاگ")

    class Meta:
        verbose_name = "تگ"
        verbose_name_plural = "تگ ها"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

class Product(models.Model):
    name = models.CharField(max_length=255, verbose_name="نام محصول")
    slug = models.SlugField(max_length=255, unique=True, allow_unicode=True, verbose_name="اسلاگ")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products', verbose_name="دسته بندی")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    main_image = models.ImageField(upload_to=upload_to, blank=True, null=True, verbose_name="تصویر اصلی")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    tags = models.ManyToManyField(Tag, blank=True, verbose_name="تگ ها")

    # Fixed discount percentage
    fixed_discount_percentage = models.PositiveIntegerField(
        default=0,
        help_text="درصد تخفیف ثابت برای کل محصول (۰ تا ۱۰۰). در صورت فعال بودن تخفیف زمان‌دار، این اعمال نمی‌شود.",
        verbose_name="تخفیف ثابت (%)"
    )

    # Timed discount
    timed_discount_percentage = models.PositiveIntegerField(
        default=0,
        help_text="درصد تخفیف زمان‌دار (۰ تا ۱۰۰)",
        verbose_name="تخفیف زمان‌دار (%)"
    )
    timed_discount_start_date = models.DateTimeField(
        blank=True, null=True, verbose_name="تاریخ شروع تخفیف زمان‌دار"
    )
    timed_discount_end_date = models.DateTimeField(
        blank=True, null=True, verbose_name="تاریخ پایان تخفیف زمان‌دار"
    )

    class Meta:
        verbose_name = "محصول"
        verbose_name_plural = "محصولات"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def is_timed_discount_active(self):
        now = timezone.now()
        return (self.timed_discount_percentage > 0 and
                self.timed_discount_start_date and
                self.timed_discount_end_date and
                self.timed_discount_start_date <= now <= self.timed_discount_end_date)

    def get_discount_percentage(self):
        if self.is_timed_discount_active():
            return self.timed_discount_percentage
        return self.fixed_discount_percentage

class ProductBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches', verbose_name="محصول")
    color = models.CharField(max_length=50, verbose_name="رنگ")
    # This total_quantity field is populated by the inline Formset
    total_quantity = models.PositiveIntegerField(default=0, verbose_name="تعداد کل بسته")
    # Image related to the color
    color_image = models.ImageField(upload_to=upload_to, blank=True, null=True, verbose_name="تصویر رنگ")

    class Meta:
        verbose_name = "بسته محصول (رنگ)"
        verbose_name_plural = "بسته‌های محصول (رنگ)"
        unique_together = ('product', 'color') # Each product should have a color once

    def __str__(self):
        return f"{self.product.name} - {self.color}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class Size(models.Model):
    size = models.CharField(max_length=20, unique=True, verbose_name="سایز")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")

    class Meta:
        verbose_name = "سایز"
        verbose_name_plural = "سایزها"
        ordering = ['order']

    def __str__(self):
        return self.size

class SizeQuantity(models.Model):
    # This model links product batch with its size and available quantity
    product_batch = models.ForeignKey(ProductBatch, on_delete=models.CASCADE, related_name='size_quantities', verbose_name="بسته محصول")
    size = models.ForeignKey(Size, on_delete=models.CASCADE, verbose_name="سایز")
    quantity = models.PositiveIntegerField(default=0, verbose_name="تعداد موجودی")
    price = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="قیمت پایه (تومان)") # Price for this specific size

    class Meta:
        verbose_name = "تعداد موجودی سایز"
        verbose_name_plural = "تعداد موجودی سایزها"
        unique_together = ('product_batch', 'size') # Each size for a product batch should be registered once

    def __str__(self):
        return f"{self.product_batch} - سایز: {self.size.size} - تعداد: {self.quantity}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update total_quantity in ProductBatch
        # This ensures total_quantity reflects sum of all sizes
        self.product_batch.total_quantity = sum(sq.quantity for sq in self.product_batch.size_quantities.all())
        self.product_batch.save()


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants', verbose_name="محصول")
    # Using SizeQuantity as "size"
    size = models.ForeignKey(SizeQuantity, on_delete=models.CASCADE, related_name='variants', verbose_name="تعداد موجودی سایز")
    color = models.CharField(max_length=50, verbose_name="رنگ") # This field should be consistent with ProductBatch.color
    price = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="قیمت واحد (تومان)") # Final price for this variant
    stock = models.PositiveIntegerField(default=0, verbose_name="موجودی کل") # Total physical stock
    online_stock = models.PositiveIntegerField(default=0, verbose_name="موجودی آنلاین") # Online purchasable stock

    class Meta:
        verbose_name = "تنوع محصول"
        verbose_name_plural = "تنوع محصولات"
        unique_together = ('product', 'size', 'color') # Each combination of product, size, and color must be unique

    def __str__(self):
        return f"{self.product.name} - {self.color} - {self.size.size.size}" # Accessing size name via size.size.size

    def get_discounted_price(self):
        discount_percentage = self.product.get_discount_percentage()
        if discount_percentage > 0:
            discounted_price = self.price * (Decimal(1) - Decimal(discount_percentage / 100))
            return discounted_price.quantize(Decimal('1.')) # Round to nearest integer
        return self.price

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name="محصول")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="کاربر") # User can be null if guest
    user_name = models.CharField(max_length=100, verbose_name="نام کاربر")
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)], verbose_name="امتیاز")
    comment = models.TextField(blank=True, verbose_name="نظر")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    is_approved = models.BooleanField(default=False, verbose_name="تایید شده")

    class Meta:
        verbose_name = "نظر"
        verbose_name_plural = "نظرات"
        ordering = ['-created_at']
        # unique_together = ('product', 'user') # Re-evaluate this if guests can review. If user is null, it won't enforce uniqueness per guest.
                                            # For now, let's keep it simple and allow multiple guest reviews.
                                            # If we want to limit guest reviews, we'd need a different mechanism (e.g., IP address + product).

    def __str__(self):
        return f"نظر {self.user_name} برای {self.product.name} - امتیاز: {self.rating}"

# ----------------------------------------------------
# User Management, Cart, and Order Models
# ----------------------------------------------------

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="کاربر")
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="شماره تلفن")
    # In the future, you can add more fields like avatar, date of birth, etc.

    class Meta:
        verbose_name = "پروفایل کاربر"
        verbose_name_plural = "پروفایل کاربران"

    def __str__(self):
        return self.user.username

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses', verbose_name="کاربر")
    province = models.CharField(max_length=100, verbose_name="استان")
    city = models.CharField(max_length=100, verbose_name="شهر")
    street = models.CharField(max_length=255, verbose_name="خیابان/کوچه")
    postal_code = models.CharField(max_length=20, verbose_name="کد پستی")
    recipient_name = models.CharField(max_length=255, verbose_name="نام گیرنده")
    recipient_phone_number = models.CharField(max_length=15, verbose_name="شماره تماس گیرنده")
    description = models.TextField(blank=True, verbose_name="توضیحات تکمیلی (مثلاً پلاک، واحد)")
    is_default = models.BooleanField(default=False, verbose_name="آدرس پیش فرض")

    class Meta:
        verbose_name = "آدرس"
        verbose_name_plural = "آدرس ها"
        # A user can only have one default address
        constraints = [
            models.UniqueConstraint(fields=['user'], condition=models.Q(is_default=True), name='unique_default_address')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.city}, {self.street}"

    def save(self, *args, **kwargs):
        # If this address is set as default, deactivate other default addresses for the user
        if self.is_default and self.user:
            self.user.addresses.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='cart', verbose_name="کاربر")
    session_key = models.CharField(max_length=40, null=True, blank=True, unique=True, verbose_name="کلید نشست (برای کاربران مهمان)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")

    class Meta:
        verbose_name = "سبد خرید"
        verbose_name_plural = "سبدهای خرید"

    def __str__(self):
        if self.user:
            return f"سبد خرید {self.user.username}"
        return f"سبد خرید مهمان ({self.session_key or 'بدون کلید'})"

    def get_total_price(self):
        # Calculate total price of items in the cart (after applying product discount)
        total = Decimal(0)
        for item in self.items.all():
            total += item.get_total_item_price()
        return total

    def get_total_items(self):
        # Total quantity of items in the cart
        return self.items.aggregate(total_quantity=models.Sum('quantity'))['total_quantity'] or 0


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name="سبد خرید")
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, verbose_name="تنوع محصول")
    quantity = models.PositiveIntegerField(default=1, verbose_name="تعداد")
    price_at_addition = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="قیمت هنگام اضافه شدن") # Price at the time of adding to cart

    class Meta:
        verbose_name = "آیتم سبد خرید"
        verbose_name_plural = "آیتم‌های سبد خرید"
        unique_together = ('cart', 'product_variant') # One variant per cart

    def __str__(self):
        return f"{self.quantity} x {self.product_variant.product.name} ({self.product_variant.color}, {self.product_variant.size.size.size})"

    def get_total_item_price(self):
        # Calculate total price of an item with product discount applied
        return self.quantity * self.product_variant.get_discounted_price()

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده'),
        ('processing', 'در حال آماده‌سازی'),
        ('shipped', 'ارسال شده'),
        ('delivered', 'تحویل شده'),
        ('cancelled', 'لغو شده'),
        ('refunded', 'بازگشت وجه'),
    ]
    SHIPPING_METHOD_CHOICES = [
        ('free_delivery', 'ارسال رایگان'),
        ('post_office', 'پست پیشتاز'),
        # You can add more methods
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', verbose_name="کاربر")
    order_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ سفارش")
    total_amount = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="مبلغ کل سفارش")
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="آدرس ارسال")
    shipping_method = models.CharField(max_length=50, choices=SHIPPING_METHOD_CHOICES, default='free_delivery', verbose_name="روش ارسال")
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="هزینه ارسال")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="مبلغ تخفیف")
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending', verbose_name="وضعیت سفارش")
    tracking_code = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name="کد پیگیری")
    coupon_used_code = models.CharField(max_length=50, blank=True, null=True, verbose_name="کد کوپن استفاده شده") # Store the coupon code used

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارشات"
        ordering = ['-order_date']

    def __str__(self):
        return f"سفارش شماره {self.id} - {self.user.username if self.user else 'کاربر مهمان'}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="سفارش")
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, verbose_name="تنوع محصول")
    quantity = models.PositiveIntegerField(verbose_name="تعداد")
    price_at_order = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="قیمت هنگام سفارش") # Unit price at the time of order

    class Meta:
        verbose_name = "آیتم سفارش"
        verbose_name_plural = "آیتم‌های سفارش"
        unique_together = ('order', 'product_variant')

    def __str__(self):
        return f"{self.quantity} x {self.product_variant.product.name} ({self.product_variant.color}, {self.product_variant.size.size.size})"

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name="کد کوپن")
    discount_percentage = models.PositiveIntegerField(
        blank=True, null=True,
        help_text="درصد تخفیف (مثلا ۱۰ برای ۱۰ درصد)",
        verbose_name="درصد تخفیف"
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=0, blank=True, null=True,
        help_text="مبلغ ثابت تخفیف به تومان",
        verbose_name="مبلغ تخفیف"
    )
    valid_from = models.DateTimeField(verbose_name="معتبر از تاریخ")
    valid_to = models.DateTimeField(verbose_name="معتبر تا تاریخ")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    usage_limit = models.PositiveIntegerField(default=1, verbose_name="محدودیت تعداد استفاده (برای هر کاربر)") # Per user limit
    used_count = models.PositiveIntegerField(default=0, verbose_name="تعداد دفعات استفاده شده")
    min_cart_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="حداقل مبلغ سبد برای اعمال")
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=0, blank=True, null=True,
        help_text="حداکثر مبلغ تخفیف قابل اعمال (اگر درصد باشد)",
        verbose_name="حداکثر مبلغ تخفیف"
    )

    class Meta:
        verbose_name = "کوپن"
        verbose_name_plural = "کوپن ها"

    def __str__(self):
        return self.code

    def clean(self):
        # Ensure only one of percentage or amount discount is filled
        if self.discount_percentage is not None and self.discount_amount is not None:
            raise ValidationError('فقط یکی از "درصد تخفیف" یا "مبلغ تخفیف" را پر کنید.')
        if self.discount_percentage is None and self.discount_amount is None:
            raise ValidationError('یکی از "درصد تخفیف" یا "مبلغ تخفیف" باید پر شود.')
        if self.discount_percentage is not None and not (0 <= self.discount_percentage <= 100):
            raise ValidationError('درصد تخفیف باید بین ۰ تا ۱۰۰ باشد.')

    def is_valid(self):
        now = timezone.now()
        return (self.is_active and
                self.valid_from <= now <= self.valid_to and
                self.used_count < self.usage_limit)

    def get_discount_value(self, cart_total):
        if not self.is_valid():
            return Decimal(0)

        discount_value = Decimal(0)
        if self.discount_percentage:
            discount_value = cart_total * (Decimal(self.discount_percentage) / 100)
        elif self.discount_amount:
            discount_value = self.discount_amount

        if self.max_discount_amount and discount_value > self.max_discount_amount:
            discount_value = self.max_discount_amount

        return discount_value.quantize(Decimal('1.')) # Round to nearest integer

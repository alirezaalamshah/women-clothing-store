from django.db import models
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    slug = models.SlugField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Slider(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='sliders/')
    link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Sliders"
        ordering = ['order']

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='products')
    fixed_discount_percentage = models.PositiveIntegerField(
        default=0,
        help_text="تخفیف ثابت بدون محدودیت زمانی (درصد)"
    )
    timed_discount_start_date = models.DateTimeField(
        blank=True, null=True,
        help_text="تاریخ شروع تخفیف زمان‌دار (میلادی، فرمت: 2025-06-25 18:00)"
    )
    timed_discount_end_date = models.DateTimeField(
        blank=True, null=True,
        help_text="تاریخ پایان تخفیف زمان‌دار (میلادی، فرمت: 2025-06-26 18:00)"
    )
    timed_discount_percentage = models.PositiveIntegerField(
        blank=True, null=True,
        help_text="درصد تخفیف زمان‌دار (0 تا 100)"
    )

    def is_timed_discount_active(self):
        if not self.timed_discount_start_date or not self.timed_discount_end_date or not self.timed_discount_percentage:
            return False
        now = timezone.now()  # 06:33 PM EDT, June 25, 2025
        return self.timed_discount_start_date <= now <= self.timed_discount_end_date

    def get_active_discount(self):
        if self.is_timed_discount_active():
            return self.timed_discount_percentage
        return self.fixed_discount_percentage

    def __str__(self):
        return self.name

class ProductBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    color = models.CharField(max_length=50)
    total_quantity = models.PositiveIntegerField(help_text="تعداد کل بسته")

    def __str__(self):
        return f"بسته {self.product.name} - رنگ {self.color}"

class SizeQuantity(models.Model):
    batch = models.ForeignKey(ProductBatch, on_delete=models.CASCADE, related_name='size_quantities')
    size = models.PositiveIntegerField(choices=[(i, i) for i in range(32, 63, 2)])  # سایزها از 32 تا 62 (فقط زوج)
    quantity = models.PositiveIntegerField(help_text="تعداد این سایز")
    price = models.PositiveIntegerField(help_text="قیمت هر واحد")

    def __str__(self):
        return f"سایز {self.size} - تعداد {self.quantity}"

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.ForeignKey(SizeQuantity, on_delete=models.CASCADE, related_name='variants')
    color = models.CharField(max_length=50)
    price = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=0, help_text="موجودی کل")
    online_stock = models.PositiveIntegerField(default=0, help_text="موجودی قابل فروش آنلاین (قابل تغییر دستی)")

    def save(self, *args, **kwargs):
        if not self.pk:
            self.online_stock = int(self.stock * 0.8) if self.stock > 0 else 0
        else:
            old_instance = ProductVariant.objects.get(pk=self.pk)
            if old_instance.stock != self.stock:
                self.online_stock = int(self.stock * 0.8) if self.stock > 0 else 0
        if self.online_stock > self.stock:
            self.online_stock = self.stock
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - سایز {self.size.size} - رنگ {self.color}"

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user_name = models.CharField(max_length=100)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"نظر {self.user_name} برای {self.product.name}"
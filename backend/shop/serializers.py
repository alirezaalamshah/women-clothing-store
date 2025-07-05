# shop/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models # Import models for Min/Max aggregation
from .models import (
    Category, Slider, Tag, Product, ProductBatch,
    Size, SizeQuantity, ProductVariant, Review,
    UserProfile, Address, Cart, CartItem, Order, OrderItem, Coupon
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueTogetherValidator
from decimal import Decimal

# ----------------------------------------------------
# Core E-commerce Serializers
# ----------------------------------------------------

class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'image_url', 'description', 'is_active']
        read_only_fields = ['slug']

    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None

class SliderSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Slider
        fields = ['id', 'title', 'image', 'image_url', 'link', 'order', 'is_active']

    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'size', 'order']

class SizeQuantitySerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True) # Display size details

    class Meta:
        model = SizeQuantity
        fields = ['id', 'size', 'quantity', 'price']

class ProductBatchSerializer(serializers.ModelSerializer):
    size_quantities = SizeQuantitySerializer(many=True, read_only=True)
    color_image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductBatch
        fields = ['id', 'product', 'color', 'total_quantity', 'color_image', 'color_image_url', 'size_quantities']

    def get_color_image_url(self, obj):
        if obj.color_image:
            return self.context['request'].build_absolute_uri(obj.color_image.url)
        return None

class ProductVariantSerializer(serializers.ModelSerializer):
    size_id = serializers.IntegerField(source='size.id', read_only=True)
    size_name = serializers.SerializerMethodField()
    size_order = serializers.IntegerField(source='size.size.order', read_only=True)

    product_name = serializers.CharField(source='product.name', read_only=True)
    discounted_price = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'product_name', 'size_id', 'size_name', 'size_order', 'color', 'price', 'display_price', 'discounted_price', 'stock', 'online_stock']

    def get_size_name(self, obj):
        if obj.size and obj.size.size:
            return obj.size.size.size
        return None

    def get_discounted_price(self, obj):
        return obj.get_discounted_price()

    def get_display_price(self, obj):
        return f"{int(obj.price):,} تومان"

class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    main_image_url = serializers.SerializerMethodField()
    active_discount_percentage = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description', 'main_image', 'main_image_url',
            'is_active', 'created_at', 'updated_at', 'tags',
            'fixed_discount_percentage', 'timed_discount_percentage',
            'timed_discount_start_date', 'timed_discount_end_date',
            'active_discount_percentage', 'min_price', 'max_price'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def get_main_image_url(self, obj):
        if obj.main_image:
            return self.context['request'].build_absolute_uri(obj.main_image.url)
        return None

    def get_active_discount_percentage(self, obj):
        return obj.get_discount_percentage()

    def get_min_price(self, obj):
        variants = obj.variants.filter(online_stock__gt=0)
        if variants.exists():
            return min(variant.get_discounted_price() for variant in variants)
        return None

    def get_max_price(self, obj):
        variants = obj.variants.filter(online_stock__gt=0)
        if variants.exists():
            return max(variant.get_discounted_price() for variant in variants)
        return None


class ProductDetailSerializer(ProductListSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    batches = ProductBatchSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ['variants', 'batches', 'reviews']

    def get_reviews(self, obj):
        approved_reviews = obj.reviews.filter(is_approved=True)
        return ReviewSerializer(approved_reviews, many=True, context=self.context).data

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'product', 'user_name', 'rating', 'comment', 'created_at', 'is_approved']
        read_only_fields = ['user', 'created_at', 'is_approved', 'user_name']

    def create(self, validated_data):
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['user'] = user
            validated_data['user_name'] = user.get_full_name() or user.username
        else:
            if not validated_data.get('user_name'):
                raise serializers.ValidationError({"user_name": "نام کاربر برای کاربران مهمان لازم است."})
        return super().create(validated_data)

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return obj.user_name

# ----------------------------------------------------
# User Management, Cart, and Order Serializers
# ----------------------------------------------------

# NEW: UserSerializer for nested updates in UserProfile
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email'] # Fields allowed for update


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "رمزهای عبور وارد شده یکسان نیستند."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        if hasattr(user, 'profile'):
            token['phone_number'] = user.profile.phone_number
        return token

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Use the new UserSerializer for nested user data

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'phone_number']
        read_only_fields = ['user'] # user field is read-only here, updated via custom logic in view

    # Add update method to handle nested user data
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserSerializer(instance.user, data=user_data, partial=True)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

        return super().update(instance, validated_data)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'user', 'province', 'city', 'street', 'postal_code',
            'recipient_name', 'recipient_phone_number', 'description', 'is_default'
        ]
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CartItemSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()
    product_variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(), source='product_variant', write_only=True
    )

    class Meta:
        model = CartItem
        fields = ['id', 'product_variant', 'product_variant_id', 'quantity', 'price_at_addition', 'total_price']
        read_only_fields = ['price_at_addition']

    def get_total_price(self, obj):
        return obj.get_total_item_price()

    def validate(self, data):
        product_variant = data.get('product_variant')
        quantity = data.get('quantity')

        if product_variant and quantity:
            if not product_variant.product.is_active:
                raise serializers.ValidationError("محصول مربوط به این تنوع فعال نیست.")
            if product_variant.online_stock < quantity:
                raise serializers.ValidationError(f"موجودی آنلاین برای این تنوع محصول کافی نیست. موجودی فعلی: {product_variant.online_stock}")
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'created_at', 'updated_at', 'items', 'total_price', 'total_items']
        read_only_fields = ['user', 'session_key', 'created_at', 'updated_at']

    def get_total_price(self, obj):
        return obj.get_total_price()

    def get_total_items(self, obj):
        return obj.get_total_items()

class OrderItemSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_variant', 'quantity', 'price_at_order']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'order_date', 'total_amount', 'shipping_address',
            'shipping_method', 'shipping_cost', 'discount_amount',
            'status', 'tracking_code', 'coupon_used_code', 'items'
        ]
        read_only_fields = [
            'user', 'order_date', 'total_amount', 'shipping_address',
            'shipping_cost', 'discount_amount', 'status', 'tracking_code', 'coupon_used_code'
        ]

    def validate_shipping_address(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated and value and value.user != request.user:
            raise serializers.ValidationError("آدرس ارسال باید متعلق به کاربر فعلی باشد.")
        return value

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_percentage', 'discount_amount',
            'valid_from', 'valid_to', 'is_active', 'usage_limit',
            'used_count', 'min_cart_amount', 'max_discount_amount'
        ]
        read_only_fields = ['used_count']

    def validate(self, attrs):
        if attrs.get('discount_percentage') is None and attrs.get('discount_amount') is None:
            raise serializers.ValidationError("باید درصد تخفیف یا مبلغ تخفیف را مشخص کنید.")
        if attrs.get('discount_percentage') is not None and attrs.get('discount_amount') is not None:
            raise serializers.ValidationError("فقط یکی از درصد تخفیف یا مبلغ تخفیف را وارد کنید.")
        if attrs.get('discount_percentage') is not None and not (0 <= attrs['discount_percentage'] <= 100):
            raise serializers.ValidationError('درصد تخفیف باید بین ۰ تا ۱۰۰ باشد.')
        return attrs

    def validate_code(self, value):
        if self.instance is None and Coupon.objects.filter(code__iexact=value).exists():
            raise serializers.ValidationError("این کد کوپن قبلاً استفاده شده است.")
        return value

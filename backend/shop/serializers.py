from rest_framework import serializers
from .models import Category, Slider, Product, ProductVariant, Tag, Review
from django.utils import timezone

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']

class ProductVariantSerializer(serializers.ModelSerializer):
    discount_percentage = serializers.IntegerField(source='product.get_active_discount')

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'size', 'color', 'price', 'stock', 'online_stock', 'discount_percentage']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['discount_percentage'] = instance.product.get_active_discount()  # اطمینان از مقداردهی
        ret['price'] = int(ret['price'])
        return ret

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'image', 'slug']

class SliderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slider
        fields = ['id', 'title', 'description', 'image', 'link', 'is_active']

class ProductSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    fixed_discount_percentage = serializers.IntegerField()
    timed_discount_percentage = serializers.IntegerField(allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'image', 'category', 'slug', 'is_active', 'created_at', 'tags', 'variants', 'fixed_discount_percentage', 'timed_discount_start_date', 'timed_discount_end_date', 'timed_discount_percentage', 'reviews']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['fixed_discount_percentage'] = int(ret['fixed_discount_percentage'])
        ret['timed_discount_percentage'] = int(ret['timed_discount_percentage']) if ret['timed_discount_percentage'] else None
        return ret
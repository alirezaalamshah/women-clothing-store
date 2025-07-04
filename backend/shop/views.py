from rest_framework import viewsets
from .models import Category, Slider, Product, ProductVariant, Tag, Review
from .serializers import CategorySerializer, SliderSerializer, ProductSerializer, ProductVariantSerializer, TagSerializer, ReviewSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class SliderViewSet(viewsets.ModelViewSet):
    queryset = Slider.objects.filter(is_active=True)
    serializer_class = SliderSerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).prefetch_related('tags', 'variants', 'reviews')
    serializer_class = ProductSerializer

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import CategoryViewSet, SliderViewSet, ProductViewSet, ProductVariantViewSet, TagViewSet, DiscountViewSet, ReviewViewSet

# router = DefaultRouter()
# router.register(r'categories', CategoryViewSet)
# router.register(r'sliders', SliderViewSet)
# router.register(r'products', ProductViewSet)
# router.register(r'product-variants', ProductVariantViewSet)
# router.register(r'tags', TagViewSet)
# router.register(r'discounts', DiscountViewSet)
# router.register(r'reviews', ReviewViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
# ]





from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, SliderViewSet, ProductViewSet, ProductVariantViewSet, TagViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'sliders', SliderViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-variants', ProductVariantViewSet)
router.register(r'tags', TagViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
# shop/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView # Import TokenRefreshView

from .views import (
    MyTokenObtainPairView, # Import custom JWT obtain pair view
    RegisterView, CategoryViewSet, SliderViewSet, TagViewSet,
    ProductViewSet, ProductVariantViewSet, ReviewViewSet,
    UserProfileViewSet, AddressViewSet, CartViewSet,
    OrderViewSet, OrderItemViewSet, CouponViewSet
)

router = DefaultRouter()
router.register(r'register', RegisterView, basename='register')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'sliders', SliderViewSet, basename='slider')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-variants', ProductVariantViewSet, basename='product-variant')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'profiles', UserProfileViewSet, basename='profile')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'cart', CartViewSet, basename='cart') # Here, basename is 'cart'
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')
router.register(r'coupons', CouponViewSet, basename='coupon')


urlpatterns = [
    path('', include(router.urls)),
    # JWT Authentication URLs - اینها فقط باید اینجا باشند
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

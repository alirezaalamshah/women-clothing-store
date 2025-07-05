# your_project_name/urls.py (main urls.py)

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from shop.views import (
    CategoryViewSet, SliderViewSet, TagViewSet, ProductViewSet,
    ReviewViewSet, CartViewSet, OrderViewSet, AddressViewSet,
    MyTokenObtainPairView, RegisterView, UserProfileViewSet # Import UserProfileViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'sliders', SliderViewSet)
router.register(r'tags', TagViewSet)
router.register(r'products', ProductViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'cart', CartViewSet, basename='cart') # basename is important for custom actions
router.register(r'orders', OrderViewSet)
router.register(r'addresses', AddressViewSet)
router.register(r'profile', UserProfileViewSet, basename='user-profile') # Add UserProfileViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
]

# Serve media files in development
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# shop/views.py

from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import F, Sum, Case, When, DecimalField, IntegerField
from django.utils import timezone
from decimal import Decimal

from .models import (
    Category, Slider, Tag, Product, ProductBatch,
    Size, SizeQuantity, ProductVariant, Review,
    UserProfile, Address, Cart, CartItem, Order, OrderItem, Coupon
)
from .serializers import (
    CategorySerializer, SliderSerializer, TagSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductBatchSerializer,
    SizeSerializer, SizeQuantitySerializer, ProductVariantSerializer, ReviewSerializer,
    MyTokenObtainPairSerializer, RegisterSerializer, UserProfileSerializer,
    AddressSerializer, CartSerializer, CartItemSerializer, OrderSerializer, CouponSerializer,
    UserSerializer
)

# JWT Views
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "کاربر با موفقیت ثبت نام شد."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User Profile ViewSet
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can access

    def get_object(self):
        # This method is called for detail actions (retrieve, update, destroy)
        # Ensure user is authenticated and has a profile
        if not self.request.user.is_authenticated:
            raise serializers.ValidationError("احراز هویت لازم است.", code=status.HTTP_401_UNAUTHORIZED)
        try:
            return self.request.user.profile
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("پروفایل کاربر یافت نشد.", code=status.HTTP_404_NOT_FOUND)

    def list(self, request, *args, **kwargs):
        # For /api/profile/, return the current user's profile
        # This is the endpoint called by AuthContext to fetch user profile
        if not request.user.is_authenticated:
            # For unauthenticated users, return an empty profile or a specific message
            # Do NOT return 401 here, as it's handled by AuthContext if no token.
            # If a token exists but is invalid, authenticatedFetch will handle it.
            # Here, we just state that no profile is available for anonymous user.
            return Response({"detail": "کاربر احراز هویت نشده است. پروفایلی برای نمایش وجود ندارد."}, status=status.HTTP_200_OK)
        
        try:
            instance = self.request.user.profile
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            # If user is authenticated but has no profile, return 404
            return Response({"detail": "پروفایل کاربر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)


    def retrieve(self, request, pk=None, *args, **kwargs):
        # For /api/profile/<pk>/, ensure pk matches current user's profile ID
        if not request.user.is_authenticated:
            return Response({"detail": "احراز هویت لازم است."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            profile_instance = self.request.user.profile
            if int(pk) != profile_instance.id:
                return Response({"detail": "شما اجازه دسترسی به این پروفایل را ندارید."}, status=status.HTTP_403_FORBIDDEN)
            serializer = self.get_serializer(profile_instance)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({"detail": "پروفایل کاربر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)


    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        
        if not request.user.is_authenticated:
            return Response({"detail": "احراز هویت لازم است."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            instance = self.request.user.profile
        except UserProfile.DoesNotExist:
            return Response({"detail": "پروفایل کاربر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        user_data = request.data.pop('user', None)
        if user_data:
            user_serializer = UserSerializer(instance.user, data=user_data, partial=partial)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return Response({"detail": "ایجاد پروفایل از این طریق مجاز نیست."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "حذف پروفایل از این طریق مجاز نیست."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


# Product Views
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class SliderViewSet(viewsets.ModelViewSet):
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    permission_classes = [AllowAny]

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).prefetch_related('category', 'tags', 'variants__size__size', 'batches', 'reviews__user')
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category_slug')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.filter(is_approved=True)
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_slug = self.request.query_params.get('product_slug')
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            if not serializer.validated_data.get('user_name'):
                raise serializers.ValidationError({"user_name": "نام کاربر برای کاربران مهمان لازم است."})
            serializer.save()


class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def get_cart(self):
        if self.request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=self.request.user)
        else:
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            cart, created = Cart.objects.get_or_create(session_key=session_key)
        return cart

    def list(self, request):
        cart = self.get_cart()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart = self.get_cart()
        product_variant_id = request.data.get('product_variant_id')
        quantity = request.data.get('quantity', 1)

        if not product_variant_id:
            return Response({"detail": "شناسه تنوع محصول لازم است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product_variant = ProductVariant.objects.get(id=product_variant_id)
        except ProductVariant.DoesNotExist:
            return Response({"detail": "تنوع محصول یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if not product_variant.product.is_active:
            return Response({"detail": "محصول مربوط به این تنوع فعال نیست."}, status=status.HTTP_400_BAD_REQUEST)

        if product_variant.online_stock < quantity:
            return Response({"detail": f"موجودی آنلاین برای این تنوع محصول کافی نیست. موجودی فعلی: {product_variant.online_stock}"}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_variant=product_variant,
            defaults={'quantity': quantity, 'price_at_addition': product_variant.get_discounted_price()}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.price_at_addition = product_variant.get_discounted_price()
            cart_item.save()

        cart.save()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'])
    def update_item(self, request):
        cart = self.get_cart()
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity')

        if not cart_item_id or quantity is None:
            return Response({"detail": "شناسه آیتم سبد خرید و تعداد لازم است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = cart.items.get(id=cart_item_id)
        except CartItem.DoesNotExist:
            return Response({"detail": "آیتم سبد خرید یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if not cart_item.product_variant.product.is_active:
            return Response({"detail": "محصول مربوط به این تنوع فعال نیست."}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            cart_item.delete()
        else:
            if cart_item.product_variant.online_stock < quantity:
                return Response({"detail": f"موجودی آنلاین برای این تنوع محصول کافی نیست. موجودی فعلی: {cart_item.product_variant.online_stock}"}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = quantity
            cart_item.price_at_addition = cart_item.product_variant.get_discounted_price()
            cart_item.save()

        cart.save()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        cart = self.get_cart()
        cart_item_id = request.data.get('cart_item_id')

        if not cart_item_id:
            return Response({"detail": "شناسه آیتم سبد خرید لازم است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = cart.items.get(id=cart_item_id)
        except CartItem.DoesNotExist:
            return Response({"detail": "آیتم سبد خرید یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        cart_item.delete()
        cart.save()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def clear_cart(self, request):
        cart = self.get_cart()
        cart.items.all().delete()
        cart.save()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def apply_coupon(self, request):
        cart = self.get_cart()
        coupon_code = request.data.get('coupon_code')

        if not coupon_code:
            return Response({"detail": "کد کوپن لازم است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=coupon_code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({"detail": "کوپن نامعتبر یا غیرفعال است."}, status=status.HTTP_404_NOT_FOUND)

        validation_errors = {}
        if coupon.valid_from and timezone.now() < coupon.valid_from:
            validation_errors['valid_from'] = "کوپن هنوز فعال نشده است."
        if coupon.valid_to and timezone.now() > coupon.valid_to:
            validation_errors['valid_to'] = "کوپن منقضی شده است."
        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            validation_errors['usage_limit'] = "محدودیت استفاده از کوپن به پایان رسیده است."
        if coupon.min_cart_amount and cart.get_total_price() < coupon.min_cart_amount:
            validation_errors['min_cart_amount'] = f"حداقل مبلغ سبد خرید برای این کوپن {coupon.min_cart_amount} تومان است."

        if validation_errors:
            return Response(validation_errors, status=status.HTTP_400_BAD_REQUEST)

        discount_amount = Decimal(0)
        if coupon.discount_percentage:
            discount_amount = (cart.get_total_price() * Decimal(coupon.discount_percentage / 100)).quantize(Decimal('1.'))
        elif coupon.discount_amount:
            discount_amount = coupon.discount_amount

        if coupon.max_discount_amount and discount_amount > coupon.max_discount_amount:
            discount_amount = coupon.max_discount_amount

        cart.applied_coupon = coupon
        cart.save()

        return Response({
            "message": "کوپن با موفقیت اعمال شد.",
            "coupon_code": coupon.code,
            "discount_amount": discount_amount,
            "new_total_price": cart.get_total_price() - discount_amount
        }, status=status.HTTP_200_OK)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items__product_variant__product', 'shipping_address')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-order_date')

    def perform_create(self, serializer):
        cart = get_object_or_404(Cart, user=self.request.user)

        if not cart.items.exists():
            raise serializers.ValidationError("سبد خرید شما خالی است و نمی‌توانید سفارش ثبت کنید.")

        order = serializer.save(user=self.request.user, total_amount=cart.get_total_price())

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product_variant=cart_item.product_variant,
                quantity=cart_item.quantity,
                price_at_order=cart_item.price_at_addition
            )
            product_variant = cart_item.product_variant
            product_variant.online_stock = F('online_stock') - cart_item.quantity
            product_variant.save()

        cart.items.all().delete()

# Address ViewSet
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        address = get_object_or_404(Address, pk=pk, user=request.user)
        Address.objects.filter(user=request.user).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'status': 'آدرس به عنوان پیش فرض تنظیم شد.'})

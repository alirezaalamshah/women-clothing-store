# shop/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Cart # Import Cart to create a cart for new users

@receiver(post_save, sender=User)
def create_user_profile_and_cart(sender, instance, created, **kwargs):
    if created:
        # Create UserProfile for the new User
        UserProfile.objects.create(user=instance)
        # Create a Cart for the new User
        Cart.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile_and_cart(sender, instance, **kwargs):
    # Ensure profile exists before trying to save it (might not exist if created manually in admin)
    if hasattr(instance, 'profile'):
        instance.profile.save()
    # Ensure cart exists before trying to save it
    if hasattr(instance, 'cart'):
        instance.cart.save()

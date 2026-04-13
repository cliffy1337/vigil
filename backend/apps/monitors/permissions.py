from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions allowed for any request (if you want public read, but we require auth anyway)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions only to owner
        return obj.user == request.user
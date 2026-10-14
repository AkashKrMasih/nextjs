from shop.models import Product


def min_allowed_quantity(product: Product) -> int:
    return product.min_order_quantity or 1


def validate_order_quantity(product: Product, quantity: int) -> str | None:
    if not isinstance(quantity, int) or quantity < 1:
        return "Quantity must be a whole number of at least 1."
    min_q = min_allowed_quantity(product)
    if quantity < min_q:
        return f"Minimum order quantity for {product.name} is {min_q}."
    if product.max_order_quantity is not None and quantity > product.max_order_quantity:
        return f"Maximum order quantity for {product.name} is {product.max_order_quantity}."
    return None

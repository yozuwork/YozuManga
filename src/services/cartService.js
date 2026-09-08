import { createCollectionService } from './firestoreService.js'

const cartService = createCollectionService('shoppingCart')

export const getCartItems = cartService.getAll
export const addCartItem = cartService.add
export const updateCartItem = cartService.update
export const deleteCartItem = cartService.remove
export const reorderCartItems = cartService.reorder

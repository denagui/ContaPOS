import { writable, type Writable } from 'svelte/store';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  imageUrl?: string;
  stock?: number;
}

class CartStore {
  private store: Writable<CartItem[]>;
  
  constructor() {
    this.store = writable([]);
  }

  subscribe = this.store.subscribe;

  addItem(product: Omit<CartItem, 'quantity'>) {
    this.store.update(items => {
      const existingIndex = items.findIndex(item => item.productId === product.productId);
      
      if (existingIndex > -1) {
        // Incrementar cantidad si ya existe
        const newItems = [...items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1
        };
        return newItems;
      } else {
        // Agregar nuevo producto
        return [...items, { ...product, quantity: 1 }];
      }
    });
  }

  removeItem(productId: string) {
    this.store.update(items => items.filter(item => item.productId !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.store.update(items => 
      items.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }

  increment(productId: string) {
    this.store.update(items =>
      items.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  decrement(productId: string) {
    this.store.update(items =>
      items.map(item =>
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.productId !== productId || item.quantity > 0)
    );
  }

  clear() {
    this.store.set([]);
  }

  getTotal(): number {
    let total = 0;
    this.store.subscribe(items => {
      total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    })();
    return total;
  }

  getCount(): number {
    let count = 0;
    this.store.subscribe(items => {
      count = items.reduce((sum, item) => sum + item.quantity, 0);
    })();
    return count;
  }

  isEmpty(): boolean {
    let empty = true;
    this.store.subscribe(items => {
      empty = items.length === 0;
    })();
    return empty;
  }

  getItems(): CartItem[] {
    let items: CartItem[] = [];
    this.store.subscribe(val => {
      items = val;
    })();
    return items;
  }
}

export const cart = new CartStore();

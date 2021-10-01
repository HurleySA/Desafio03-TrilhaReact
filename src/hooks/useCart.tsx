import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const copyCart = [...cart];
      const existCart = copyCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      

      const maxAmount = stock.data.amount;
      const atualAmount = existCart ? existCart.amount : 0;
      const amount = atualAmount + 1;
      
      if(amount > maxAmount){
        toast.error('Quantidade solicitada fora de estoque');
      }else{
        if(existCart){
          existCart.amount = amount;
  
        }else{
          const product = await api.get(`/products/${productId}` )
          const newProduct = {
            ...product.data,
            amount:1
          }
          copyCart.push(newProduct);
        }
  
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
      setCart(copyCart);

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const copyCart = [...cart];
      const existCart = copyCart.find(product => product.id === productId);
      const newCopy = copyCart.filter((product) => product.id !== productId);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCopy));
      setCart(newCopy);

    } catch {
        toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const copyCart = [...cart];
      const existCart = copyCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);  
      const maxAmount = stock.data.amount;
      
      if(amount > maxAmount || amount < 0){
        toast.error('Quantidade solicitada fora de estoque');
      }else{
        if(existCart){
          if(amount > existCart.amount){ addProduct(existCart.id)
          }else {
            const copyCart = [...cart];
            const existCart = copyCart.find(product => product.id === productId);
            const atualAmount = existCart ? existCart.amount : 0;
        
            if((atualAmount - 1) < 0){
              toast.error('Erro na alteração de quantidade do produto');
            }else{
              if(existCart) (copyCart[copyCart.indexOf(existCart)].amount--);
              console.log(existCart)
            }
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
            setCart(copyCart);}
        } 
      }
      

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

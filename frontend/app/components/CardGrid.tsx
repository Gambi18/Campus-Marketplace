import { Products } from '@/types/products';
import ItemCard from './Card';

function CardGrid() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>{Products.map((product)=>(
        <ItemCard key={product.id}/>
    ))}</div>
  )
}

export default CardGrid
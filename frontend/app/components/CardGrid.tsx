import { Products } from '@/types/products';
import ItemCard from './Card';

function CardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4 justify-items-center">{Products.map((product)=>(
        <ItemCard key={product.id}/>
    ))}</div>
  )
}

export default CardGrid
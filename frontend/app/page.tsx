import Button from "./components/Button";
import ItemCard from "./components/Card";
import Footer from "./components/Footer";
import Input from "./components/Input";
import Navbar from "./components/Navbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="text-center">
                <Navbar/>
                <h1 className="text-4xl font-bold mb-4">Campus Marketplace</h1>
                <p className="text-xl text-gray-600">Welcome to the campus marketplace platform</p>
                <Button  variant="primary">Click Me</Button>
               
                 <Input label="name" name="name" />
                 <Input label="name" name="name" type="password" />
                 <ItemCard/>
                  <ItemCard/>
                   <ItemCard/>
                    <ItemCard/>
                 <Footer/>
            </div>
        </main>
    );
}

import Button from "./components/Button";
import ItemCard from "./components/Card";
import Footer from "./components/Footer";
import Input from "./components/Input";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="text-center">
                <Navbar/>
                <h1 className="text-4xl font-bold mb-4">Campus Marketplace</h1>
                <p className="text-xl text-gray-600">Welcome to the campus marketplace platform</p>
                <Button  variant="primary">Click Me</Button>
                 <ItemCategory/>
                 <Input label="name" name="name" />
                 <Input label="name" name="name" type="password" />
                 <ItemCard/>
                  <ItemCard/>
                   <ItemCard/>
                    <ItemCard item={{
                        id:"1",
                        title:"Math Textbook",
                        category:"Books",
                        price: 15000,
                        images:["https://images.unsplash.com/photo-1588912914017-923900a34710?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hdGglMjB0ZXh0Ym9va3xlbnwwfHwwfHx8MA%3D%3D"]
                    }}/>
                 <Footer/>
            </div>
        </main>
    );
}

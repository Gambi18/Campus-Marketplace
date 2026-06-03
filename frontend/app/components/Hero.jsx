import Button from "./Button"


function Hero() {
  return (
    <div className="bg-gradient-to-r from-brand-primary to-purple-600 min-h-[500px] flex flex-col justify-center items-center p-8md:p-20 text-white">
       <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-xs font-medium mb-6">
        <span className="w-4 h-4 bg-white text-purple-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
        <span>Trusted by 5,000+ students across campus</span>
      </div>
        <h2 className="font-bold text-4xl">Buy & Sell Safely Within Your Campus <br />Community</h2>
        <p className="text-white/80 text-sm md:text-lg max-w-2xl mb-8 leading-relaxed">Discover affordable student deals, trusted sellers, and secondhand
            essentials from university classmates. The smartest way to 
            shop locally
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 p-4">
            <Button variant="secondary"><span>Start Browsing</span></Button>
         <Button variant="outlined"><span>Sell an Item</span></Button>
        </div>
        
    </div>
  )
}

export default Hero
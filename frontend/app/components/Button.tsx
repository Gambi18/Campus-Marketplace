import React from 'react'

interface ButtonProps {
 text : string,
 type? : 'primary', 'secondary', 'form',
 size? : 'sm', 'md', 'lg'

}

function Button({text, variant = 'primary', size='md', type='button'}: ButtonProps) {
  return (
    <button className='glass btn bg-primary'>
      Click Me
    </button>
  )
}

export default Button;

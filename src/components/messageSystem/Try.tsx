import React,{useState,useEffect} from 'react';
interface TryProps{
    tryName:string,
    onDelete:(num: Number)=>void,
}


export default function Try({tryName,onDelete}:TryProps){
    const [num,setNum]=useState<any>(0);
    const handleClick = () => {
        const newNum = num + 1; // Increase num by 1
        setNum(newNum); // Update state
        onDelete(newNum); // Call onDelete with the new num value
      };
    return(
        <>
            <div className='bg-bl'>
                {num*2}
            </div>
            <button  onClick={handleClick}>delete</button>
        </>
    );
}
import { createContext, useState, useEffect } from "react";


export const AppContext = createContext()

const AppContextProvider = (props) => {
    const backendurl = import.meta.env.VITE_BACKEND_URL

    const months = ["" , "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Dark Mode state: default to 'dark' as requested
    const [theme, setTheme] = useState(localStorage.getItem('adminTheme') || 'dark')

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('adminTheme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    // Function to calculate the age eg. ( 20_01_2000 => 24 )
    const calculateAge = (dob) => {
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        return age
    }

    const value = {
        backendurl,
        slotDateFormat,
        calculateAge,
        theme,
        toggleTheme,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider
import { useState } from "react";
import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify"

export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {
    const backendurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
    const [dtoken, setdtoken] = useState(localStorage.getItem('dtoken') ? localStorage.getItem('dtoken') : '')
    const [appointments, setAppointments] = useState([])
    const [dashdata, setdashdata] = useState(false)
    const [profileData, setProfileData] = useState(false)
    const [videoSlots, setVideoSlots] = useState([])



    const getAppointments = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/doctor/appointments', { headers: { dtoken } })
            if (data.success) {
                setAppointments(data.appointments)
                console.log(data.appointments)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const completeAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendurl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dtoken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
                getdashdata()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendurl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dtoken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
                // after creating dashboard
                getdashdata()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const getdashdata = async () => {
        try {

            const { data } = await axios.get(backendurl + '/api/doctor/dashboard', { headers: { dtoken } })

            if (data.success) {
                setdashdata(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const getProfileData = async () => {
        try {

            const { data } = await axios.get(backendurl + '/api/doctor/profile', { headers: { dtoken } })
            console.log(data.profileData)
            setProfileData(data.profileData)

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Reminder functions
    const createReminder = async (reminderData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/reminders/create', reminderData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                return data.reminder
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const getDoctorReminders = async () => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/reminders', {}, { headers: { dtoken } })
            if (data.success) {
                return data.reminders
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const updateReminder = async (reminderData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/reminders/update', reminderData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                return data.reminder
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const deleteReminder = async (reminderId) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/reminders/delete', { reminderId }, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                return true
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const getDailyEarnings = async (startDate, endDate) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/earnings/daily', { startDate, endDate }, { headers: { dtoken } })
            if (data.success) {
                return data.dailyEarnings
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Pet Report Functions
    const getPetReports = async (userId) => {
        try {
            const { data } = await axios.get(backendurl + `/api/doctor/pet-report/user/${userId}`, { headers: { dtoken } })
            if (data.success) {
                return data.reports
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const createPetReport = async (reportData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/pet-report/doctor/create', reportData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                return data.data
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const addVisitNote = async (noteData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/pet-report/visit-note', noteData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                return data.report
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const updateVideoStatus = async (updateData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/update-video-status', updateData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                getAppointments()
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
            return false
        }
    }

    const getVideoSlots = async () => {
        try {
            const { data } = await axios.get(backendurl + '/api/doctor/video-slots/get', { headers: { dtoken } })
            if (data.success) {
                setVideoSlots(data.slots)
                return data.slots
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error fetching video slots:', error)
            toast.error('Failed to fetch video slots')
        }
    }

    const addVideoSlot = async (slotData) => {
        try {
            const { data } = await axios.post(backendurl + '/api/doctor/video-slots/add', slotData, { headers: { dtoken } })
            if (data.success) {
                toast.success(data.message)
                getVideoSlots()
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error('Failed to add video slot')
            return false
        }
    }




    const value = {
        dtoken, setdtoken, backendurl, appointments, setAppointments, getAppointments,
        completeAppointment, cancelAppointment, getdashdata, dashdata, setdashdata,
        getProfileData, profileData, setProfileData,
        createReminder, getDoctorReminders, updateReminder, deleteReminder, getDailyEarnings,
        getPetReports, createPetReport, addVisitNote, updateVideoStatus,
        videoSlots, getVideoSlots, addVideoSlot
    }


    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )
}

export default DoctorContextProvider

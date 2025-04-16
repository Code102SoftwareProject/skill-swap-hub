'use client';

import NotificationCard from "@/components/Notification";
import { useEffect,useState } from "react";
import { useParams } from "next/navigation";


export default function NotiPage(){
    const { userId } = useParams() as { userId: string };
    
    useEffect(() => {

        async function fetchNotifications() {
            const notificationsData = await fetch('/api/notifications/{userId}');
        }
        fetchNotifications();

    }, []);



    return(
        <>
        </>
    )
}
import React from 'react';
import PostDetail from '@/components/communityForum/postDetail';
import Navbar from '@/components/homepage/Navbar';
import Chatbot from "@/components/chatassistant/chatbot";

export default function PostDetailPage() {
    return (
        <div className='flex flex-col bg-white min-h-screen'>
            <div className="sticky top-0 z-10">
                <Navbar />
            </div>
            <div>
                <PostDetail />
                <Chatbot />
            </div>
        </div>
    );
}
"use client";

import React from "react";

interface TextMessageProps {
  content: string;
}

/**
 * TextMessage component
 * @param content - The text content of the message
 * @description A component to display regular text messages
 */
const TextMessage = ({ content }: TextMessageProps) => {
  return <span className="block">{content}</span>;
};

export default TextMessage;
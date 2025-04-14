import fetch from "node-fetch";
import base64 from "base-64";

const zoomAccountId = "RB98CfAQTZaYSFQShMZtTQ";
const zoomClientId = "RWRuokrIQCSFw59BWMwYfQ";
const zoomClientSecret = "ghTU3uWVDMtcZud0jl14rI421cZreMA5";

const getAuthHeaders = () => {
    return {
        Authorization: `Basic ${base64.encode(
            `${zoomClientId}:${zoomClientSecret}`
        )}`,
        "Content-Type": "application/json",
    };
};

const generateZoomAccessToken = async () => {
    try {
        const response = await fetch(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
            {
                method: "POST",
                headers: getAuthHeaders(),
            }
        );

        const jsonResponse = await response.json();
        
        if (jsonResponse.access_token) {
            console.log("Zoom Access Token:", jsonResponse.access_token);
            return jsonResponse.access_token;
        } else {
            console.error("Error: Access token not received");
        }
    } catch (error) {
        console.log("generateZoomAccessToken Error --> ", error);
        throw error;
    }
};

// Call the function to log the access token
generateZoomAccessToken();

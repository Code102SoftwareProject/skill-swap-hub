// Interface for creating a new badge
export interface BadgeInput {
  badgeName: string; // Name of the badge
  badgeImage: string; // URL or path to the badge image
  criteria: string; // Requirements to earn the badge
  description: string; // Detailed explanation of the badge
}

// Interface for updating an existing badge
// All fields except badgeId are optional
export interface BadgeUpdateInput {
  badgeId: string; // Unique identifier of the badge (required)
  badgeName?: string; // Optional new name
  badgeImage?: string; // Optional new image
  criteria?: string; // Optional new criteria
  description?: string; // Optional new description
}

/**
 * Creates a new badge via API
 * @param badgeData - The badge data to create
 * @returns The created badge data from the server
 * @throws Error if the request fails
 */
export async function createBadge(badgeData: BadgeInput) {
  try {
    // Send POST request to badge API endpoint
    const response = await fetch("/api/badge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(badgeData),
    });

    const data = await response.json();

    // Handle unsuccessful response
    if (!response.ok) {
      throw new Error(data.message || "Failed to create badge");
    }

    return data;
  } catch (error) {
    console.error("Error creating badge:", error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}

/**
 * Updates an existing badge via API
 * @param badgeData - The badge data to update (badgeId is required)
 * @returns The updated badge data from the server
 * @throws Error if the request fails
 */
export async function updateBadge(badgeData: BadgeUpdateInput) {
  try {
    // Send PATCH request to badge API endpoint
    const response = await fetch("/api/badge", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(badgeData),
    });

    const data = await response.json();

    // Handle unsuccessful response
    if (!response.ok) {
      throw new Error(data.message || "Failed to update badge");
    }

    return data;
  } catch (error) {
    console.error("Error updating badge:", error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}

/**
 * Deletes a badge via API
 * @param badgeId - The unique identifier of the badge to delete
 * @returns Response data from the server
 * @throws Error if the request fails
 */
export async function deleteBadge(badgeId: string) {
  try {
    // Send DELETE request with query parameter
    const response = await fetch(`/api/badge?badgeId=${badgeId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    // Handle unsuccessful response
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete badge");
    }

    return data;
  } catch (error) {
    console.error("Error deleting badge:", error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}

/**
 * Gets all badges via API
 * @returns Array of badge objects from the server
 * @throws Error if the request fails
 */
export async function getAllBadges() {
  try {
    // Send GET request to fetch all badges
    const response = await fetch("/api/badge");

    const data = await response.json();

    // Handle unsuccessful response
    if (!response.ok) {
      throw new Error("Failed to fetch badges");
    }

    return data;
  } catch (error) {
    console.error("Error fetching badges:", error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}

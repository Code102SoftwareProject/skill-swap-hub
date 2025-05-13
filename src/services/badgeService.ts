export interface BadgeInput {
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

export interface BadgeUpdateInput {
  badgeId: string;
  badgeName?: string;
  badgeImage?: string;
  criteria?: string;
  description?: string;
}

/**
 * Creates a new badge via API
 * @param badgeData - The badge data to create
 * @returns The created badge data
 */
export async function createBadge(badgeData: BadgeInput) {
  try {
    const response = await fetch("/api/badge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(badgeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create badge");
    }

    return data;
  } catch (error) {
    console.error("Error creating badge:", error);
    throw error;
  }
}

/**
 * Updates an existing badge via API
 * @param badgeData - The badge data to update
 * @returns The updated badge data
 */
export async function updateBadge(badgeData: BadgeUpdateInput) {
  try {
    const response = await fetch("/api/badge", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(badgeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update badge");
    }

    return data;
  } catch (error) {
    console.error("Error updating badge:", error);
    throw error;
  }
}

export async function deleteBadge(badgeId: string) {
  try {
    const response = await fetch(`/api/badge?badgeId=${badgeId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete badge");
    }

    return data;
  } catch (error) {
    console.error("Error deleting badge:", error);
    throw error;
  }
}

/**
 * Gets all badges via API
 * @returns All badges data
 */
export async function getAllBadges() {
  try {
    const response = await fetch("/api/badge");

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to fetch badges");
    }

    return data;
  } catch (error) {
    console.error("Error fetching badges:", error);
    throw error;
  }
}

import connect from "@/lib/db";
import Badge from "@/lib/models/badgeSchema";

/**
 * Script to create the "First Exchange" badge if it doesn't exist
 */
async function createFirstExchangeBadge() {
  try {
    await connect();

    // Check if "First Exchange" badge already exists
    const existingBadge = await Badge.findOne({ badgeName: "First Exchange" });

    if (existingBadge) {
      console.log("First Exchange badge already exists");
      return existingBadge;
    }

    // Create the "First Exchange" badge
    const firstExchangeBadge = new Badge({
      badgeName: "First Exchange",
      badgeImage: "badges/first_exchange.png", // You can update this with actual image path
      criteria: "Achievement Milestone Badges",
      description:
        "Congratulations on completing your first skill exchange! This badge recognizes your initial step into the skill-sharing community.",
    });

    await firstExchangeBadge.save();
    console.log(
      "First Exchange badge created successfully:",
      firstExchangeBadge
    );
    return firstExchangeBadge;
  } catch (error) {
    console.error("Error creating First Exchange badge:", error);
    throw error;
  }
}

// Export the function for use in other parts of the application
export { createFirstExchangeBadge };

// If this script is run directly, execute the function
if (require.main === module) {
  createFirstExchangeBadge()
    .then(() => {
      console.log("Badge creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Badge creation failed:", error);
      process.exit(1);
    });
}

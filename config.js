window.ANV_CONFIG = {
    // --- IMPORTANT ---
    // Change the PIN for production use.
    pin: "1111",

    // The key used to store all application data in localStorage.
    localStorageKey: "anandvan_app_data_v1",

    // Default settings for a new/reset application.
    settings: {
        name: "Anandvan Homestay",
        tagline: "A Nature Homestay",
        address: "Ward 7, Gompa Road, Siyal\nManali, H.P\n175131",
        phone: "+91 8376814797",
        email: "anandvanstays@gmail.com",
        invoicePrefix: "ANV",
        paymentRecipientName: "Shipra Sharma",
        logoUrl: "./logo.png",
        qrCodeUrl: "./upi-qr-code.png",

        // New Commercial-Grade Settings
        convenienceFeePercentage: 15,
        defaultInvoiceNotes: "Thank you for staying with us! Please scan the QR code to pay via any UPI app.",
        currency: "INR",
        currencySymbol: "₹",

        // New Theme Settings
        primaryDeepColor: "#004d40",
        primaryLightColor: "#00796b",
        accentGoldColor: "#ffc107",
        fontFamily: "Poppins"
    },
    
    // Default options for various select inputs.
    bookingSources: ["Direct", "Airbnb", "Booking.com", "MakeMyTrip", "Instagram", "Referral"],
    roomTypes: ["Solis", "Pomarium"],
    expenseCategories: ["Staff", "Utilities", "Maintenance", "F&B", "Marketing", "Housekeeping", "Transport", "Other"],
    paymentMethods: ["UPI", "Cash", "Card", "Bank Transfer", "Other"],
    googleFonts: ["Poppins", "Lato", "Montserrat", "Roboto", "Open Sans"]

};
// This tells the main app that the config is ready.
window.dispatchEvent(new Event('configLoaded'));

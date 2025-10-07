window.ANV_CONFIG = {
    pin: "1111",
    localStorageKey: "anandvan_app_data_v1",
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
        convenienceFeePercentage: 15,
        defaultInvoiceNotes: "Thank you for staying with us!",
        currency: "INR",
        currencySymbol: "₹",
        primaryDeepColor: "#004d40",
        primaryLightColor: "#00796b",
        accentGoldColor: "#ffc107",
        fontFamily: "Poppins"
    },
    bookingSources: ["Direct", "Airbnb", "Booking.com", "MakeMyTrip", "Instagram", "Referral"],
    roomTypes: ["Solis", "Pomarium"],
    expenseCategories: ["Staff", "Utilities", "Maintenance", "F&B", "Marketing", "Housekeeping", "Transport", "Other"],
    paymentMethods: ["UPI", "Cash", "Card", "Bank Transfer", "Other"],
    googleFonts: ["Poppins", "Lato", "Montserrat", "Roboto", "Open Sans"],

    // THIS OBJECT WAS MISSING
    seedData: {
        bookings: [],
        expenses: [],
        menu: [
            { id: 'MENU-1', name: 'Tea', rate: 50 },
            { id: 'MENU-2', name: 'Coffee', rate: 100 }
        ]
    }
};

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
        convenienceFeePercentage: 15,
        defaultInvoiceNotes: "Thank you for staying with us! Please scan the QR code to pay via any UPI app.",
        currency: "INR",
        currencySymbol: "₹",
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
    googleFonts: ["Poppins", "Lato", "Montserrat", "Roboto", "Open Sans"],

    // THIS OBJECT WAS MISSING AND IS NOW RESTORED
    seedData: {
        bookings: [
            {
                id: 'BK-1728151800000',
                invoiceNo: "ANV-2025-001",
                guest: 'Sample Guest',
                phone: '9876543210',
                email: 'sample@example.com',
                source: 'Direct',
                room: 'Solis',
                checkIn: "2025-10-06",
                checkOut: "2025-10-10",
                nights: 4,
                roomRate: 6000,
                cafeBill: 172.50,
                cafeItems: [{ id: 'CI-1', item: 'Coffee', qty: 2, rate: 30, amount: 60 }, { id: 'CI-2', item: 'Maggi', qty: 1, rate: 90, amount: 90 }],
                stayPaid: false,
                cafePaid: false,
                notes: 'Sample booking notes.',
                total: 24172.50
            }
        ],
        expenses: [
            {
                id: 'EX-1728065400000',
                date: "2025-10-05",
                category: 'Utilities',
                subcategory: 'Electricity',
                amount: 2500,
                vendor: 'HPSEB',
                paymentMethod: 'UPI',
                notes: 'Sample expense.'
            }
        ],
        menu: [
            { id: 'MENU-1', name: 'Tea', rate: 50 },
            { id: 'MENU-2', name: 'Coffee', rate: 100 }
        ]
    }
};

/**
 * ANANDVAN MANAGEMENT TOOL
 * All application logic is contained within this file, under the ANV namespace.
 */

const ANV = {
    state: { settings: {}, bookings: [], expenses: [], menu: [] },
    elements: {}, charts: {}, activeBookingId: null, activeExpenseId: null, activeInvoiceBookingId: null,

    theme: {
        apply: () => {
            const { settings } = ANV.state;
            const defaults = window.ANV_CONFIG.settings;
            const root = document.documentElement;
            
            root.style.setProperty('--primary-deep', settings.primaryDeepColor || defaults.primaryDeepColor);
            root.style.setProperty('--primary-light', settings.primaryLightColor || defaults.primaryLightColor);
            root.style.setProperty('--accent-gold', settings.accentGoldColor || defaults.accentGoldColor);
            root.style.setProperty('--font-family', `"${settings.fontFamily || defaults.fontFamily}", sans-serif`);

            const existingFontLink = document.getElementById('google-font-link');
            if (existingFontLink) existingFontLink.remove();

            const font = settings.fontFamily || defaults.fontFamily;
            if (font) {
                const link = document.createElement('link');
                link.id = 'google-font-link';
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;700&display=swap`;
                document.head.appendChild(link);
            }
        }
    },

    util: {
        num: (val) => Number(String(val).replace(/,/g, '')) || 0,
        money: (n) => {
            const { currency, currencySymbol } = ANV.state.settings;
            const amount = ANV.util.num(n);
            try {
                return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
            } catch (e) {
                return `${currencySymbol || '₹'}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        },
        uid: (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        today: () => new Date().toISOString().split('T')[0],
        nights: (checkIn, checkOut) => {
            if (!checkIn || !checkOut) return 1;
            const ci = new Date(checkIn); const co = new Date(checkOut);
            if (isNaN(ci) || isNaN(co) || co <= ci) return 1;
            return Math.max(1, Math.ceil(Math.abs(co - ci) / 864e5));
        },
        nextInvoiceNo: () => {
            const prefix = ANV.state.settings.invoicePrefix; const year = new Date().getFullYear();
            const yearPrefix = `${prefix}-${year}-`;
            const currentYearInvoices = ANV.state.bookings.map(b => b.invoiceNo).filter(inv => inv && inv.startsWith(yearPrefix));
            if (currentYearInvoices.length === 0) return `${yearPrefix}001`;
            const maxNum = currentYearInvoices.reduce((max, inv) => {
                const num = parseInt(inv.substring(yearPrefix.length), 10);
                return num > max ? num : max;
            }, 0);
            return `${yearPrefix}${(maxNum + 1).toString().padStart(3, '0')}`;
        },
    },

    stateManager: {
        save: () => localStorage.setItem(window.ANV_CONFIG.localStorageKey, JSON.stringify(ANV.state)),
        load: () => {
            const savedState = localStorage.getItem(window.ANV_CONFIG.localStorageKey);
            if (savedState) {
                const loadedState = JSON.parse(savedState);
                ANV.state = {
                    ...loadedState,
                    settings: {
                        ...window.ANV_CONFIG.settings,
                        ...loadedState.settings
                    }
                };
            } else {
                ANV.state = { 
                    settings: window.ANV_CONFIG.settings, 
                    bookings: [], 
                    expenses: [], 
                    menu: [] 
                };
                if(ANV.state.bookings.length === 0 && ANV.state.expenses.length === 0) {
                    ANV.state.bookings = window.ANV_CONFIG.seedData.bookings || [];
                    ANV.state.expenses = window.ANV_CONFIG.seedData.expenses || [];
                    ANV.state.menu = window.ANV_CONFIG.seedData.menu || [];
                }
                ANV.stateManager.save();
            }
        }
    },

    render: {
        all: () => { ANV.render.header(); ANV.render.dashboard(); ANV.render.bookings(); ANV.render.expenses(); ANV.render.invoiceStudio(); ANV.render.settings(); },
        header: () => {
            const { settings } = ANV.state;
            ANV.elements.header.logo.src = settings.logoUrl;
            ANV.elements.header.brandName.textContent = settings.name;
            ANV.elements.header.tagline.textContent = settings.tagline;
        },
        dashboard: () => {
            const { bookings, expenses } = ANV.state; const now = new Date();
            const currentYear = now.getFullYear(); const currentMonth = now.getMonth();
            const ytdBookings = bookings.filter(b => new Date(b.checkOut).getFullYear() === currentYear);
            const ytdExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
            const mtdBookings = ytdBookings.filter(b => new Date(b.checkOut).getMonth() === currentMonth);
            const mtdExpenses = ytdExpenses.filter(e => new Date(e.date).getMonth() === currentMonth);
            const ytdIncome = ytdBookings.reduce((s, b) => s + ANV.util.num(b.total), 0);
            const ytdExpensesTotal = ytdExpenses.reduce((s, e) => s + ANV.util.num(e.amount), 0);
            const mtdIncome = mtdBookings.reduce((s, b) => s + ANV.util.num(b.total), 0);
            const mtdExpensesTotal = mtdExpenses.reduce((s, e) => s + ANV.util.num(e.amount), 0);
            const ytdCafe = ytdBookings.reduce((s, b) => s + ANV.util.num(b.cafeBill), 0);
            const ytdStay = ytdBookings.reduce((s, b) => s + (ANV.util.num(b.roomRate) * ANV.util.num(b.nights)), 0);
            const activeBookings = bookings.filter(b => new Date(b.checkOut) >= now && new Date(b.checkIn) <= now).length;
            ANV.elements.dashboard.mtdIncome.textContent = ANV.util.money(mtdIncome);
            ANV.elements.dashboard.mtdExpenses.textContent = ANV.util.money(mtdExpensesTotal);
            ANV.elements.dashboard.ytdIncome.textContent = ANV.util.money(ytdIncome);
            ANV.elements.dashboard.ytdExpenses.textContent = ANV.util.money(ytdExpensesTotal);
            ANV.elements.dashboard.ytdCafe.textContent = ANV.util.money(ytdCafe);
            ANV.elements.dashboard.ytdStay.textContent = ANV.util.money(ytdStay);
            ANV.elements.dashboard.ytdInvoices.textContent = ytdBookings.length;
            ANV.elements.dashboard.activeBookings.textContent = activeBookings;
            if (ANV.charts.cafeVsStay) ANV.render.charts.cafeVsStay(ytdBookings);
            if (ANV.charts.revenueBySource) ANV.render.charts.revenueBySource(ytdBookings);
            if (ANV.charts.expenseBreakdown) ANV.render.charts.expenseBreakdown(ytdExpenses);
        },
        charts: {
            cafeVsStay: (bookings) => {
                const monthlyData = Array(12).fill(0).map(() => ({ stay: 0, cafe: 0 }));
                bookings.forEach(b => { const month = new Date(b.checkOut).getMonth(); monthlyData[month].cafe += ANV.util.num(b.cafeBill); monthlyData[month].stay += ANV.util.num(b.roomRate) * ANV.util.num(b.nights); });
                ANV.charts.cafeVsStay.data.datasets[0].data = monthlyData.map(d => d.stay); ANV.charts.cafeVsStay.data.datasets[1].data = monthlyData.map(d => d.cafe); ANV.charts.cafeVsStay.update();
            },
            revenueBySource: (bookings) => {
                const sources = window.ANV_CONFIG.bookingSources; const sourceData = {}; sources.forEach(s => sourceData[s] = 0);
                bookings.forEach(b => { if (sourceData.hasOwnProperty(b.source)) sourceData[b.source] += ANV.util.num(b.total); });
                ANV.charts.revenueBySource.data.labels = Object.keys(sourceData); ANV.charts.revenueBySource.data.datasets[0].data = Object.values(sourceData); ANV.charts.revenueBySource.update();
            },
            expenseBreakdown: (expenses) => {
                const categories = window.ANV_CONFIG.expenseCategories; const expenseData = {}; categories.forEach(c => expenseData[c] = 0);
                expenses.forEach(e => { if (expenseData.hasOwnProperty(e.category)) expenseData[e.category] += ANV.util.num(e.amount); });
                ANV.charts.expenseBreakdown.data.labels = Object.keys(expenseData); ANV.charts.expenseBreakdown.data.datasets[0].data = Object.values(expenseData); ANV.charts.expenseBreakdown.update();
            }
        },
        bookings: (filter = '') => {
            const tableBody = ANV.elements.bookings.tableBody;
            const searchTerm = filter.toLowerCase();
            const filteredBookings = ANV.state.bookings.filter(b => b.guest.toLowerCase().includes(searchTerm) || (b.invoiceNo && b.invoiceNo.toLowerCase().includes(searchTerm)) || (b.phone && b.phone.includes(searchTerm)) || (b.email && b.email.toLowerCase().includes(searchTerm)) || b.source.toLowerCase().includes(searchTerm) || b.room.toLowerCase().includes(searchTerm));
            tableBody.innerHTML = filteredBookings.map(b => `
                <tr>
                    <td>${b.checkIn}</td> <td>${b.guest}</td> <td>${b.room}</td> <td>${b.source}</td>
                    <td>${b.nights}</td> <td>${ANV.util.money(b.roomRate)}</td> <td>${ANV.util.money(b.cafeBill)}</td>
                    <td>${ANV.util.money(b.total)}</td>
                    <td><span class="paid-status ${b.stayPaid ? 'paid-yes' : 'paid-no'}">${b.stayPaid ? 'Yes' : 'No'}</span></td>
                    <td><span class="paid-status ${b.cafePaid ? 'paid-yes' : 'paid-no'}">${b.cafePaid ? 'Yes' : 'No'}</span></td>
                    <td class="action-buttons">
                        <button onclick="ANV.handlers.showBookingModal('${b.id}')" title="Edit">✏️</button>
                        <button onclick="ANV.handlers.onDeleteBooking('${b.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>`).join('');
        },
        expenses: (filter = '') => {
            const tableBody = ANV.elements.expenses.tableBody; const searchTerm = filter.toLowerCase();
            const filteredExpenses = ANV.state.expenses.filter(e => Object.values(e).some(val => String(val).toLowerCase().includes(searchTerm)));
            tableBody.innerHTML = filteredExpenses.map(e => `
                <tr>
                    <td>${e.date}</td> <td>${e.category}</td> <td>${e.subcategory || ''}</td>
                    <td>${e.vendor || ''}</td> <td>${ANV.util.money(e.amount)}</td> <td>${e.paymentMethod || ''}</td>
                    <td>${e.notes || ''}</td>
                    <td class="action-buttons">
                        <button onclick="ANV.handlers.showExpenseModal('${e.id}')" title="Edit">✏️</button>
                        <button onclick="ANV.handlers.onDeleteExpense('${e.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>`).join('');
        },
        invoiceStudio: (filter = '') => {
            const listEl = ANV.elements.invoice.bookingList;
            const searchTerm = filter.toLowerCase();
            const filteredBookings = ANV.state.bookings.filter(b => b.guest.toLowerCase().includes(searchTerm) || (b.invoiceNo && b.invoiceNo.toLowerCase().includes(searchTerm))).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
            listEl.innerHTML = filteredBookings.map(b => `<li onclick="ANV.handlers.onSelectInvoiceBooking('${b.id}')" class="${b.id === ANV.activeInvoiceBookingId ? 'active' : ''}"><strong>${b.guest}</strong><br><small>${b.invoiceNo || 'No Invoice'} | ${b.checkIn}</small></li>`).join('');
            ANV.elements.invoice.menuItemSelect.innerHTML = ANV.state.menu.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
            ANV.render.invoicePreview();
        },
        invoicePreview: () => {
            const booking = ANV.state.bookings.find(b => b.id === ANV.activeInvoiceBookingId);
            const printArea = ANV.elements.invoice.printArea;
            if (!booking) {
                ANV.elements.invoice.content.classList.add('hidden'); ANV.elements.invoice.placeholder.classList.remove('hidden'); printArea.innerHTML = ''; return;
            }
            ANV.elements.invoice.content.classList.remove('hidden'); ANV.elements.invoice.placeholder.classList.add('hidden');
            const { settings } = ANV.state;
            const cafeSubtotal = (booking.cafeItems || []).reduce((sum, item) => sum + ANV.util.num(item.amount), 0);
            const convenienceFee = cafeSubtotal * (ANV.util.num(settings.convenienceFeePercentage) / 100);
            const cafeTotal = cafeSubtotal + convenienceFee;

            const renderSimplePreview = () => {
                const cafeItems = booking.cafeItems || [];
                return `
                <div class="invoice-preview-wrapper">
                    <h2>Café Bill For: ${booking.guest}</h2>
                    <p><strong>Invoice No:</strong> ${booking.invoiceNo || 'N/A'}</p>
                    <table class="invoice-preview-table">
                        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
                        <tbody>
                            ${cafeItems.length > 0 ? cafeItems.map(item => `
                            <tr>
                                <td>${item.item}</td>
                                <td>${item.qty}</td>
                                <td>${ANV.util.money(item.rate)}</td>
                                <td>${ANV.util.money(item.amount)}</td>
                                <td style="width: 1%;"><button class="action-btn-remove" onclick="ANV.handlers.onRemoveCafeItem('${item.id}')" title="Remove Item">🗑️</button></td>
                            </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;">No café items added yet.</td></tr>`}
                        </tbody>
                        <tfoot>
                            <tr><td colspan="4">Subtotal</td><td>${ANV.util.money(cafeSubtotal)}</td></tr>
                            <tr><td colspan="4">Convenience Fee (${settings.convenienceFeePercentage}%)</td><td>${ANV.util.money(convenienceFee)}</td></tr>
                            <tr class="total"><td colspan="4">Café Total</td><td>${ANV.util.money(cafeTotal)}</td></tr>
                        </tfoot>
                    </table>
                </div>`;
            };
            
            const generateSimplePrintHTML = (type) => {
                const stayTotal = ANV.util.num(booking.roomRate) * ANV.util.num(booking.nights);
                const grandTotal = stayTotal + cafeTotal;
                const isVoucher = type === 'voucher';
                const title = isVoucher ? 'INVOICE' : 'Cafe Bill';
                const billDate = new Date().toLocaleDateString('en-GB');
                const items = isVoucher ? [{ item: `Room Stay (${booking.nights} nights)`, qty: 1, rate: stayTotal, amount: stayTotal }, ...(booking.cafeItems || [])] : (booking.cafeItems || []);
                const notes = booking.notes || settings.defaultInvoiceNotes || "";
                let totalsHtml;
                if (isVoucher) {
                    totalsHtml = `<tr><td>Subtotal</td><td>${ANV.util.money(stayTotal + cafeSubtotal)}</td></tr>
                                <tr><td>Convenience Fee</td><td>${ANV.util.money(convenienceFee)}</td></tr>
                                <tr class="grand-total"><td>Total</td><td>${ANV.util.money(grandTotal)}</td></tr>`;
                } else {
                    totalsHtml = `<tr><td>Subtotal</td><td>${ANV.util.money(cafeSubtotal)}</td></tr>
                                <tr><td>Convenience Fee</td><td>${ANV.util.money(convenienceFee)}</td></tr>
                                <tr class="grand-total"><td>Total</td><td>${ANV.util.money(cafeTotal)}</td></tr>`;
                }
                return `
                <div class="isp-wrapper">
                    <div class="isp-header">
                        <div class="isp-header-left">
                            <img src="${settings.logoUrl}" class="isp-logo" alt="Logo">
                            <p>${settings.address}</p>
                        </div>
                        <div class="isp-header-right">${settings.qrCodeUrl ? `<img src="${settings.qrCodeUrl}" class="isp-qr-code"><p>${settings.name}<br>${settings.paymentRecipientName}</p>` : ''}</div>
                    </div>
                    <div class="isp-title"><h1>${title}</h1><p>${billDate}</p></div>
                    <div class="isp-parties">
                        <div><h3>Invoice for</h3><p>${booking.guest}<br>${booking.phone || ''}</p></div>
                        <div><h3>Payable to</h3><p>${settings.paymentRecipientName}<br>${settings.phone}</p></div>
                        <div><h3>Invoice #</h3><p>${booking.invoiceNo || 'N/A'}</p></div>
                    </div>
                    <table class="isp-items-table">
                        <thead><tr><th>Description</th><th>Date</th><th>Qty</th><th>Unit price</th><th>Total price</th></tr></thead>
                        <tbody>${items.map(item => `<tr><td>${item.item || item.name}</td><td>${billDate}</td><td>${item.qty}</td><td>${ANV.util.money(item.rate)}</td><td>${ANV.util.money(item.amount)}</td></tr>`).join('')}</tbody>
                    </table>
                    <div class="isp-totals"><table>${totalsHtml}</table></div>
                    <div class="isp-footer"><p>${notes}</p></div>
                </div>`;
            };
            printArea.innerHTML = renderSimplePreview();
            printArea.dataset.cafeBillHtml = generateSimplePrintHTML('cafe');
            printArea.dataset.voucherHtml = generateSimplePrintHTML('voucher');
        },
        settings: () => {
            const { settings } = ANV.state;
            const form = ANV.elements.settings.form;
            for (const key in settings) {
                if (form.elements[key]) form.elements[key].value = settings[key];
            }
            ANV.elements.settings.menuEditor.value = ANV.state.menu.map(item => `${item.name}, ${item.rate}`).join('\n');
            const fontSelect = document.getElementById('font-family-select');
            fontSelect.innerHTML = window.ANV_CONFIG.googleFonts.map(font => `<option value="${font}" ${settings.fontFamily === font ? 'selected' : ''}>${font}</option>`).join('');
        },
    },

    handlers: {
        onTabClick: (e) => {
            if (!e.target.classList.contains('nav-tab')) return;
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`${e.target.dataset.tab}-view`).classList.add('active');
        },
        onRemoveCafeItem: (itemId) => {
            if (!ANV.activeInvoiceBookingId) return;
            const bookingIndex = ANV.state.bookings.findIndex(b => b.id === ANV.activeInvoiceBookingId);
            if (bookingIndex === -1) return;
            const booking = ANV.state.bookings[bookingIndex];
            booking.cafeItems = booking.cafeItems.filter(item => item.id !== itemId);
            const cafeSubtotal = booking.cafeItems.reduce((sum, item) => sum + ANV.util.num(item.amount), 0);
            const convenienceFee = cafeSubtotal * (ANV.util.num(ANV.state.settings.convenienceFeePercentage) / 100);
            booking.cafeBill = cafeSubtotal + convenienceFee;
            booking.total = (ANV.util.num(booking.roomRate) * ANV.util.num(booking.nights)) + ANV.util.num(booking.cafeBill);
            ANV.stateManager.save();
            ANV.render.invoiceStudio();
            ANV.render.bookings();
        },
        onAddCafeItem: () => {
            if (!ANV.activeInvoiceBookingId) return;
            const bookingIndex = ANV.state.bookings.findIndex(b => b.id === ANV.activeInvoiceBookingId);
            if (bookingIndex === -1) return;
            const booking = ANV.state.bookings[bookingIndex];
            const menuItemId = ANV.elements.invoice.menuItemSelect.value;
            const qty = ANV.util.num(ANV.elements.invoice.menuItemQty.value);
            
            const menuItem = ANV.state.menu.find(m => m.id === menuItemId);

            if (!menuItem || qty <= 0) {
                console.error("Could not find menu item with ID:", menuItemId, "in menu:", ANV.state.menu);
                return;
            }
            const newItem = { id: ANV.util.uid('CI'), item: menuItem.name, qty: qty, rate: ANV.util.num(menuItem.rate), amount: ANV.util.num(menuItem.rate) * qty };
            if (!booking.cafeItems) booking.cafeItems = [];
            booking.cafeItems.push(newItem);
            const cafeSubtotal = booking.cafeItems.reduce((sum, item) => sum + ANV.util.num(item.amount), 0);
            const convenienceFee = cafeSubtotal * (ANV.util.num(ANV.state.settings.convenienceFeePercentage) / 100);
            booking.cafeBill = cafeSubtotal + convenienceFee;
            booking.total = (ANV.util.num(booking.roomRate) * ANV.util.num(booking.nights)) + ANV.util.num(booking.cafeBill);
            ANV.stateManager.save();
            ANV.render.invoiceStudio();
            ANV.render.bookings();
        },
        onSaveSettings: (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const feePercentage = ANV.util.num(formData.get('convenienceFeePercentage'));
            formData.set('convenienceFeePercentage', feePercentage);
            
            ANV.state.settings = { ...ANV.state.settings, ...Object.fromEntries(formData.entries()) };
            ANV.stateManager.save();
            ANV.theme.apply();
            ANV.render.all();
            alert('Settings saved!');
        },
        onPrint: (type) => {
            const printArea = ANV.elements.invoice.printArea;
            const htmlToPrint = type === 'cafe' ? printArea.dataset.cafeBillHtml : printArea.dataset.voucherHtml;
            if (!htmlToPrint) return;
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`<html><head><title>Print</title><link rel="stylesheet" href="style.css"></head><body>${htmlToPrint}</body></html>`);
            doc.close();
            setTimeout(() => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch(e) {
                    console.error("Print failed:", e);
                    alert("Could not open print dialog. Please check your browser's popup blocker settings.");
                } finally {
                    document.body.removeChild(iframe);
                }
            }, 500);
        },
        showBookingModal: (bookingId = null) => {
            ANV.activeBookingId = bookingId;
            const booking = bookingId ? ANV.state.bookings.find(b => b.id === bookingId) : {};
            const title = bookingId ? 'Edit Booking' : 'New Booking';
            const formHtml = `
                <form id="booking-form" class="modal-form">
                    <label class="full-width">Guest Name <input type="text" name="guest" required value="${booking.guest || ''}"></label>
                    <label>Phone <input type="tel" name="phone" value="${booking.phone || ''}"></label>
                    <label>Email <input type="email" name="email" value="${booking.email || ''}"></label>
                    <label>Source <select name="source">${window.ANV_CONFIG.bookingSources.map(s => `<option value="${s}" ${booking.source === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
                    <label>Room <select name="room">${window.ANV_CONFIG.roomTypes.map(r => `<option value="${r}" ${booking.room === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
                    <label>Check-in <input type="date" name="checkIn" value="${booking.checkIn || ANV.util.today()}"></label>
                    <label>Check-out <input type="date" name="checkOut" value="${booking.checkOut || ''}"></label>
                    <label>Nights <input type="number" name="nights" readonly value="${booking.nights || 1}"></label>
                    <label>Room Rate (per night) <input type="number" name="roomRate" step="0.01" value="${booking.roomRate || ''}"></label>
                    <div class="modal-checkbox-group full-width">
                        <label><input type="checkbox" name="stayPaid" ${booking.stayPaid ? 'checked' : ''}> Stay Paid</label>
                        <label><input type="checkbox" name="cafePaid" ${booking.cafePaid ? 'checked' : ''}> Café Paid</label>
                    </div>
                    <label class="full-width">Notes <textarea name="notes" rows="3">${booking.notes || ''}</textarea></label>
                    <h3 class="full-width">Total: <span id="booking-total">${ANV.util.money(booking.total || 0)}</span></h3>
                    <button type="submit" class="primary-button full-width">Save Booking</button>
                </form>`;
            ANV.showModal(title, formHtml);
            const form = document.getElementById('booking-form');
            const updateTotals = () => {
                const nights = ANV.util.nights(form.elements.checkIn.value, form.elements.checkOut.value);
                form.elements.nights.value = nights;
                const cafeBill = ANV.activeBookingId ? ANV.util.num(ANV.state.bookings.find(b=>b.id===ANV.activeBookingId).cafeBill) : 0;
                const total = ANV.util.num(form.elements.roomRate.value) * nights + cafeBill;
                document.getElementById('booking-total').textContent = ANV.util.money(total);
            };
            form.elements.checkIn.addEventListener('change', updateTotals);
            form.elements.checkOut.addEventListener('change', updateTotals);
            form.elements.roomRate.addEventListener('input', updateTotals);
        },
        onSaveBooking: (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const bookingData = Object.fromEntries(formData.entries());
            const nights = ANV.util.nights(bookingData.checkIn, bookingData.checkOut);
            const roomRate = ANV.util.num(bookingData.roomRate);
            const cafeBill = ANV.activeBookingId ? ANV.util.num(ANV.state.bookings.find(b=>b.id===ANV.activeBookingId).cafeBill) : 0;
            const updatedBooking = {
                guest: bookingData.guest, phone: bookingData.phone, email: bookingData.email,
                source: bookingData.source, room: bookingData.room, checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut, nights: nights, roomRate: roomRate,
                stayPaid: form.elements.stayPaid.checked, cafePaid: form.elements.cafePaid.checked,
                notes: bookingData.notes, cafeBill: cafeBill,
                cafeItems: ANV.activeBookingId ? ANV.state.bookings.find(b=>b.id===ANV.activeBookingId).cafeItems : [],
            };
            updatedBooking.total = (updatedBooking.roomRate * updatedBooking.nights) + updatedBooking.cafeBill;
            if (ANV.activeBookingId) {
                const index = ANV.state.bookings.findIndex(b => b.id === ANV.activeBookingId);
                ANV.state.bookings[index] = { ...ANV.state.bookings[index], ...updatedBooking };
            } else {
                updatedBooking.id = ANV.util.uid('BK');
                updatedBooking.invoiceNo = ANV.util.nextInvoiceNo();
                ANV.state.bookings.push(updatedBooking);
            }
            ANV.stateManager.save();
            ANV.render.all();
            ANV.hideModal();
        },
        onDeleteBooking: (bookingId) => {
            if (confirm('Are you sure you want to delete this booking? This cannot be undone.')) {
                ANV.state.bookings = ANV.state.bookings.filter(b => b.id !== bookingId);
                ANV.stateManager.save();
                ANV.render.all();
            }
        },
        showExpenseModal: (expenseId = null) => {
            ANV.activeExpenseId = expenseId;
            const expense = expenseId ? ANV.state.expenses.find(e => e.id === expenseId) : {};
            const title = expenseId ? 'Edit Expense' : 'New Expense';
            const formHtml = `<form id="expense-form" class="modal-form"><label>Date <input type="date" name="date" required value="${expense.date || ANV.util.today()}"></label><label>Amount <input type="number" name="amount" step="0.01" required value="${expense.amount || ''}"></label><label>Category <select name="category">${window.ANV_CONFIG.expenseCategories.map(c => `<option value="${c}" ${expense.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Payment Method <select name="paymentMethod">${window.ANV_CONFIG.paymentMethods.map(p => `<option value="${p}" ${expense.paymentMethod === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label>Subcategory <input type="text" name="subcategory" value="${expense.subcategory || ''}"></label><label>Vendor <input type="text" name="vendor" value="${expense.vendor || ''}"></label><label class="full-width">Notes <textarea name="notes" rows="3">${expense.notes || ''}</textarea></label><button type="submit" class="primary-button full-width">Save Expense</button></form>`;
            ANV.showModal(title, formHtml);
        },
        onSaveExpense: (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const expenseData = Object.fromEntries(formData.entries());
            const updatedExpense = { ...expenseData, amount: ANV.util.num(expenseData.amount) };
            if (ANV.activeExpenseId) {
                const index = ANV.state.expenses.findIndex(ex => ex.id === ANV.activeExpenseId);
                updatedExpense.id = ANV.activeExpenseId;
                ANV.state.expenses[index] = updatedExpense;
            } else {
                updatedExpense.id = ANV.util.uid('EX');
                ANV.state.expenses.push(updatedExpense);
            }
            ANV.stateManager.save();
            ANV.render.all();
            ANV.hideModal();
        },
        onDeleteExpense: (expenseId) => {
            if (confirm('Are you sure you want to delete this expense? This cannot be undone.')) {
                ANV.state.expenses = ANV.state.expenses.filter(e => e.id !== expenseId);
                ANV.stateManager.save();
                ANV.render.all();
            }
        },
        onSelectInvoiceBooking: (bookingId) => { ANV.activeInvoiceBookingId = bookingId; ANV.render.invoiceStudio(); },
        onSaveMenu: () => {
            const menuText = ANV.elements.settings.menuEditor.value;
            const lines = menuText.split('\n').filter(line => line.trim() !== '');
            const newMenu = lines.map(line => { const parts = line.split(','); if (parts.length < 2) return null; const name = parts[0].trim(); const rate = ANV.util.num(parts.slice(1).join('').trim()); if (!name || isNaN(rate)) return null; return { id: ANV.util.uid('MENU'), name, rate }; }).filter(Boolean);
            ANV.state.menu = newMenu;
            ANV.stateManager.save();
            ANV.render.invoiceStudio();
            alert('Menu saved!');
        },
        onImportJson: (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedState = JSON.parse(event.target.result);
                    if (importedState.settings && importedState.bookings && importedState.expenses && importedState.menu) {
                        if (confirm('This will replace all current data. Are you sure?')) { ANV.state = importedState; ANV.stateManager.save(); window.location.reload(); }
                    } else { throw new Error("Invalid data structure."); }
                } catch (err) { alert('Error importing file. Make sure it is a valid backup file.'); } finally { e.target.value = null; }
            };
            reader.readAsText(file);
        },
    },

    init: () => {
        if (sessionStorage.getItem('anv_authenticated') !== 'true') { window.location.href = 'login.html'; return; }
        ANV.stateManager.load();
        ANV.cacheElements();
        ANV.theme.apply();
        ANV.initCharts();
        ANV.attachListeners();
        ANV.render.all();
    },

    cacheElements: () => {
        ANV.elements = {
            modal: document.getElementById('modal'), modalTitle: document.getElementById('modal-title'), modalBody: document.getElementById('modal-body'),
            header: { logo: document.getElementById('header-logo'), brandName: document.getElementById('header-brand-name'), tagline: document.getElementById('header-tagline') },
            dashboard: { mtdIncome: document.getElementById('mtd-income'), mtdExpenses: document.getElementById('mtd-expenses'), ytdIncome: document.getElementById('ytd-income'), ytdExpenses: document.getElementById('ytd-expenses'), ytdCafe: document.getElementById('ytd-cafe'), ytdStay: document.getElementById('ytd-stay'), ytdInvoices: document.getElementById('ytd-invoices'), activeBookings: document.getElementById('active-bookings') },
            bookings: { tableBody: document.getElementById('bookings-table-body'), searchInput: document.getElementById('booking-search') },
            expenses: { tableBody: document.getElementById('expenses-table-body'), searchInput: document.getElementById('expense-search') },
            invoice: { bookingList: document.getElementById('invoice-booking-list'), searchInput: document.getElementById('invoice-booking-search'), content: document.getElementById('invoice-content'), placeholder: document.getElementById('invoice-placeholder'), printArea: document.getElementById('invoice-print-area'), menuItemSelect: document.getElementById('menu-item-select'), menuItemQty: document.getElementById('menu-item-qty') },
            settings: { form: document.getElementById('settings-form'), menuEditor: document.getElementById('menu-editor') }
        };
    },
    
    initCharts: () => {
        if (typeof Chart === 'undefined') { console.warn("Chart.js not loaded"); return; }
        Chart.defaults.font.family = 'inherit';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartContexts = {
            cafeVsStay: document.getElementById('cafeVsStayChart'),
            revenueBySource: document.getElementById('revenueBySourceChart'),
            expenseBreakdown: document.getElementById('expenseBreakdownChart')
        };
        if (chartContexts.cafeVsStay) {
            if(ANV.charts.cafeVsStay) ANV.charts.cafeVsStay.destroy();
            ANV.charts.cafeVsStay = new Chart(chartContexts.cafeVsStay, { type: 'bar', data: { labels: months, datasets: [{ label: 'Stay Revenue', data: [], backgroundColor: ANV.state.settings.primaryDeepColor },{ label: 'Café Revenue', data: [], backgroundColor: ANV.state.settings.accentGoldColor }] }, options: { responsive: true, plugins: { title: { display: true, text: 'Cafe vs Stay Revenue (YTD)' } }, scales: { x: { stacked: true }, y: { stacked: true } } } });
            
            if(ANV.charts.revenueBySource) ANV.charts.revenueBySource.destroy();
            ANV.charts.revenueBySource = new Chart(chartContexts.revenueBySource, { type: 'bar', data: { labels: [], datasets: [{ label: 'Total Revenue', data: [], backgroundColor: ANV.state.settings.primaryLightColor }] }, options: { responsive: true, indexAxis: 'y', plugins: { title: { display: true, text: 'Revenue by Source (YTD)' } } } });

            if(ANV.charts.expenseBreakdown) ANV.charts.expenseBreakdown.destroy();
            ANV.charts.expenseBreakdown = new Chart(chartContexts.expenseBreakdown, { type: 'doughnut', data: { labels: [], datasets: [{ label: 'Expenses', data: [], backgroundColor: [ANV.state.settings.primaryDeepColor, ANV.state.settings.primaryLightColor, ANV.state.settings.accentGoldColor, '#b2dfdb', '#ff8f00', '#ff6f00', '#757575'] }] }, options: { responsive: true, plugins: { title: { display: true, text: 'Expense Breakdown (YTD)' } } } });
        }
    },

    attachListeners: () => {
        document.querySelector('.app-nav').addEventListener('click', ANV.handlers.onTabClick);
        document.getElementById('logout-button').addEventListener('click', () => { sessionStorage.removeItem('anv_authenticated'); window.location.href = 'login.html'; });
        ANV.elements.modal.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) ANV.hideModal(); });
        ANV.elements.modalBody.addEventListener('submit', (e) => { if (e.target.id === 'booking-form') ANV.handlers.onSaveBooking(e); if (e.target.id === 'expense-form') ANV.handlers.onSaveExpense(e); });
        document.getElementById('add-booking-btn').addEventListener('click', () => ANV.handlers.showBookingModal());
        ANV.elements.bookings.searchInput.addEventListener('input', (e) => ANV.render.bookings(e.target.value));
        document.getElementById('export-bookings-csv').addEventListener('click', () => { const rows = [['CheckIn', 'Guest', 'Room', 'Source', 'Nights', 'RoomRate', 'CafeBill', 'Total', 'StayPaid', 'CafePaid', 'InvoiceNo']]; ANV.state.bookings.forEach(b => rows.push([b.checkIn, b.guest, b.room, b.source, b.nights, b.roomRate, b.cafeBill, b.total, b.stayPaid, b.cafePaid, b.invoiceNo])); ANV.util.exportToCsv('anandvan-bookings.csv', rows); });
        document.getElementById('add-expense-btn').addEventListener('click', () => ANV.handlers.showExpenseModal());
        ANV.elements.expenses.searchInput.addEventListener('input', (e) => ANV.render.expenses(e.target.value));
        document.getElementById('export-expenses-csv').addEventListener('click', () => { const rows = [['Date', 'Category', 'Subcategory', 'Vendor', 'Amount', 'PaymentMethod']]; ANV.state.expenses.forEach(e => rows.push([e.date, e.category, e.subcategory, e.vendor, e.amount, e.paymentMethod])); ANV.util.exportToCsv('anandvan-expenses.csv', rows); });
        ANV.elements.invoice.searchInput.addEventListener('input', (e) => ANV.render.invoiceStudio(e.target.value));
        document.getElementById('add-cafe-item-btn').addEventListener('click', ANV.handlers.onAddCafeItem);
        document.getElementById('print-cafe-bill').addEventListener('click', () => ANV.handlers.onPrint('cafe'));
        document.getElementById('print-voucher').addEventListener('click', () => ANV.handlers.onPrint('voucher'));
        document.getElementById('settings-form').addEventListener('submit', ANV.handlers.onSaveSettings);
        document.getElementById('save-menu-btn').addEventListener('click', ANV.handlers.onSaveMenu);
        document.getElementById('export-json-btn').addEventListener('click', () => ANV.util.downloadJson(ANV.state, 'anandvan-backup.json'));
        document.getElementById('import-json-input').addEventListener('change', ANV.handlers.onImportJson);
        document.getElementById('reset-data-btn').addEventListener('click', () => { if (confirm('DANGER! This will delete all data permanently. Are you absolutely sure?')) { localStorage.removeItem(window.ANV_CONFIG.localStorageKey); window.location.reload(); } });
    },
    
    showModal: (title, bodyHtml) => { ANV.elements.modalTitle.textContent = title; ANV.elements.modalBody.innerHTML = bodyHtml; ANV.elements.modal.classList.add('active'); },
    hideModal: () => { ANV.elements.modal.classList.remove('active'); ANV.elements.modalBody.innerHTML = ''; }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ANV.init); } else { ANV.init(); }
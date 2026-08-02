import "server-only";

type InvoiceAddresses = {
    supplier: string;
    customer: string;
};

function value(name: string) {
    return process.env[name]?.trim() ?? "";
}

export function getInvoiceAddresses(): InvoiceAddresses {
    const addresses: InvoiceAddresses = {
        supplier: value("INVOICE_SUPPLIER_ADDRESS"),
        customer: value("INVOICE_CUSTOMER_ADDRESS"),
    };

    if (!addresses.supplier || !addresses.customer) {
        throw new Error(
            "Invoice addresses are not fully configured in this environment.",
        );
    }

    return addresses;
}

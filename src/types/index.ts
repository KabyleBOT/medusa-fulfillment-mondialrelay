export interface Context {
	login: string;
	password: string;
	customerId: string;
	culture: string;
	versionAPI: string;
}

export interface Address {
	title: string;
	firstName: string;
	lastName: string;
	streetname: string;
	addressAdd2: string;
	countryCode: string;
	postCode: string;
	city: string;
	addressAdd1: string;
	mobileNo: string;
	email: string;
}

export interface Parcel {
	content: string;
	weight: {
		value: number;
		unit: string;
	};
}

export interface Shipment {
	orderNo: string;
	customerNo: string;
	parcelCount: number;
	deliveryMode: {
		mode: string;
		location: string;
	};
	collectionMode: {
		mode: string;
		location: string;
	};
	parcels: Parcel[];
	deliveryInstruction: string;
	sender: Address;
	recipient: Address;
}

export interface ShipmentCreationRequest {
	context: Context;
	outputOptions: {
		outputFormat: string;
		outputType: string;
	};
	shipmentsList: Shipment[];
}

export interface MondialRelayOptions {
	apiBaseUrl: string;
	login: string;
	password: string;
	customerId: string;
	businessEmail: string;
	businessPhone: string;
}

export interface FulfillmentProviderData {
	[key: string]: unknown;
}

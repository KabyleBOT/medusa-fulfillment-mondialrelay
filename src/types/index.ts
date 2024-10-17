export interface Context {
	login: string;
	password: string;
	customerId: string;
	culture: string;
	versionAPI: string;
}

export interface Address {
	title: string;
	firstname: string;
	lastname: string;
	streetname: string;
	addressAdd2: string;
	countryCode: string;
	postCode: string;
	city: string;
	addressAdd1: string;
	mobileNo: string;
	email: string;
	returnLocation?: string;
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
	deliveryMode: DeliveryMode;
	collectionMode: CollectionMode;
	parcels: Parcel[];
	deliveryInstruction: string;
	sender: Address;
	recipient: Address;
}

export interface ShipmentCreationRequest {
	context: Context;
	outputOptions: OutputOptions;
	shipmentsList: Shipment[];
}

export enum DeliveryModemodeEnum {
	HOM = "HOM", // Home delivery
	HOC = "HOC", // Home delivery (specific for Spain)
	LD1 = "LD1", // Home delivery for standard shipments
	LDS = "LDS", // Home delivery for heavy or bulky shipments
	LCC = "LCC", // Merchant delivery
	DRI = "DRI", // Colisdrive® delivery
	PR = "24R", // Point Relais® delivery
	PRXL = "24L", // Point Relais® XL delivery
	PRXXL = "24X", // Point Relais® XXL delivery
	LOCKER = "24C", // Locker delivery
}

export type DeliveryMode =
	| {
			mode:
				| DeliveryModemodeEnum.PR
				| DeliveryModemodeEnum.PRXL
				| DeliveryModemodeEnum.PRXXL
				| DeliveryModemodeEnum.LOCKER;
			location: string;
	  }
	| {
			mode:
				| DeliveryModemodeEnum.HOM
				| DeliveryModemodeEnum.HOC
				| DeliveryModemodeEnum.LD1
				| DeliveryModemodeEnum.LDS
				| DeliveryModemodeEnum.LCC
				| DeliveryModemodeEnum.DRI;

			location: "";
	  };

export enum CollectionModemodeEnum {
	CCC = "CCC", // Merchant collection
	CDR = "CDR", // Home collection for standard shipments
	CDS = "CDS", // Home collection for heavy or bulky shipments
	REL = "REL", // Point Relais® collection
}

export type CollectionMode = {
	mode: CollectionModemodeEnum;
	location: "";
};

export interface MondialRelayOptions {
	apiBaseUrl: string;
	login: string;
	password: string;
	customerId: string;
	culture: string;
	businessAddress: Address;
}

export interface FulfillmentProviderData {
	[key: string]: unknown;
}

export type OutputOptions =
	| {
			outputType: "PdfUrl";
			outputFormat:
				| "A4"
				| "A5"
				| "10*15";
	  }
	| {
			outputType: "QRCode";
			outputFormat: undefined;
	  }
	| {
			outputType: "ZplCode";
			outputFormat: "Generic_ZPL_10x15_200dpi";
	  }
	| {
			outputType: "IplCode";
			outputFormat: "Generic_IPL_10x15_204dpi";
	  }
	| {
			outputType: undefined;
			outputFormat: undefined;
	  };

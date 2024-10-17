import {
	AbstractFulfillmentService,
	Cart,
	Fulfillment,
	LineItem,
	Logger,
	MedusaContainer,
	Order,
	OrderService,
	ShippingMethod,
} from "@medusajs/medusa";
import { CreateReturnType } from "@medusajs/medusa/dist/types/fulfillment-provider";
import { MedusaError } from "medusa-core-utils";
import { EntityManager } from "typeorm";
import {
	CollectionMode,
	CollectionModemodeEnum,
	DeliveryMode,
	DeliveryModemodeEnum,
	MondialRelayOptions,
	OutputOptions,
} from "../types";
import MondialRelayClient from "../utils/mondial-relay-client";
import { PricedShippingOption } from "@medusajs/medusa/dist/types/pricing";

// Define a type that extends MedusaContainer and includes any additional services
export interface InjectedDependencies
	extends MedusaContainer {
	logger: Logger;
	manager: EntityManager;
	orderService: OrderService;
}

class MondialRelayFulfillmentService extends AbstractFulfillmentService {
	static identifier = "mondialrelay";

	private client: MondialRelayClient;
	protected readonly config_: MondialRelayOptions;
	protected readonly container_: InjectedDependencies;
	protected readonly logger_: Logger;
	protected readonly orderService_: OrderService;

	constructor(
		container: InjectedDependencies,
		options: MondialRelayOptions
	) {
		super(
			container as any,
			options as any
		);

		this.config_ = options;
		this.container_ = container;
		this.logger_ = container.logger;
		this.orderService_ =
			container.orderService;
		this.client =
			new MondialRelayClient(
				options,
				container.logger
			);
	}

	async createFulfillment(
		method: {
			[x: string]: unknown;
		} & ShippingMethod,
		items: LineItem[],
		order: Order,
		fulfillment: Fulfillment
	): Promise<{ [x: string]: unknown }> {
		const businessAddress =
			this.config_.businessAddress;

		const parcels = [
			{
				content: fulfillment.id,
				weight: {
					value: items?.reduce(
						(acc, item) =>
							acc +
							(item?.fulfilled_quantity ??
								1) *
								(item?.variant
									?.weight ?? 500),
						0
					),
					unit: "gr",
				},
			},
		];

		const isPrintInStore =
			method?.shipping_option?.metadata
				?.print === "in_store";

		const isHomeDelivry =
			method?.shipping_option?.metadata
				?.type === "home";

		const isLocker =
			order?.shipping_address?.metadata
				?.isLocker === true;

		const outputOptions: OutputOptions =
			isPrintInStore
				? {
						outputType: "QRCode",
						outputFormat: undefined,
				  }
				: {
						outputFormat: "A4",
						outputType: "PdfUrl",
				  };

		const deliveryMode: DeliveryMode =
			isHomeDelivry
				? {
						mode: DeliveryModemodeEnum.HOM,
						location: "",
				  }
				: {
						mode: isLocker
							? DeliveryModemodeEnum.LOCKER
							: DeliveryModemodeEnum.PR,
						location: order
							?.shipping_address
							?.address_2 as string,
				  };

		const collectionMode: CollectionMode =
			{
				mode: CollectionModemodeEnum.REL,
				location: "",
			};

		const shipmentRequest = {
			context: {
				login: this.client.login,
				password: this.client.password,
				customerId:
					this.client.customerId,
				culture: this.client.culture,
				versionAPI:
					this.client.versionAPI,
			},
			outputOptions,
			shipmentsList: [
				{
					orderNo:
						order?.display_id?.toString() ??
						"",
					// medusa customer id is too long for mondial relay wich only accept 9 characters
					customerNo: "",
					parcelCount: 1,
					deliveryMode,
					collectionMode,
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title:
							businessAddress?.title ??
							"",
						firstname:
							businessAddress?.firstname ??
							"",
						lastname:
							businessAddress?.lastname ??
							"",
						streetname:
							businessAddress?.streetname ??
							"",
						countryCode:
							businessAddress?.countryCode ??
							"",
						postCode:
							businessAddress?.postCode ??
							"",
						city:
							businessAddress?.city ??
							"",
						addressAdd1:
							businessAddress?.addressAdd1 ??
							"",
						addressAdd2:
							businessAddress?.addressAdd2 ??
							"",
						mobileNo:
							businessAddress.mobileNo ??
							"",
						email:
							businessAddress.email ??
							"",
					},
					recipient: {
						title: "",
						firstname:
							order?.shipping_address
								?.first_name ?? "",
						lastname:
							order?.shipping_address
								?.last_name ?? "",
						streetname:
							order?.shipping_address
								?.address_1 ?? "",
						addressAdd2:
							order?.shipping_address
								?.address_2 ?? "",
						countryCode:
							order?.shipping_address
								?.country_code ?? "",
						postCode:
							order?.shipping_address
								?.postal_code ?? "",
						city:
							order?.shipping_address
								.city ?? "",
						addressAdd1: "",
						mobileNo:
							order?.shipping_address
								?.phone ?? "",
						email: order?.email ?? "",
					},
				},
			],
		};

		return await this.client.createShipment(
			shipmentRequest
		);
	}

	async createReturn(
		returnOrder: CreateReturnType
	): Promise<Record<string, unknown>> {
		let order: Order =
			returnOrder?.order;

		if (
			!order &&
			returnOrder?.order_id
		) {
			try {
				order =
					await this.orderService_.retrieve(
						returnOrder?.order_id,
						{
							relations: [
								"shipping_address",
							],
						}
					);
			} catch (error) {
				throw new Error(
					`Order with id ${returnOrder?.order_id} not found`
				);
			}
		}

		const businessAddress =
			this.config_.businessAddress;

		const parcels = [
			{
				content: returnOrder?.id,
				weight: {
					value:
						returnOrder?.items?.reduce(
							(acc, item) =>
								acc +
								(item?.item
									?.returned_quantity ??
									1) *
									(item?.item?.variant
										?.weight ?? 500),
							0
						),
					unit: "gr",
				},
			},
		];

		const isPrintInStore =
			returnOrder?.shipping_method
				?.shipping_option?.metadata
				?.print === "in_store";

		const isHomeDelivry =
			returnOrder?.shipping_method
				?.shipping_option?.metadata
				?.type === "home";

		const outputOptions: OutputOptions =
			isPrintInStore
				? {
						outputType: "QRCode",
						outputFormat: undefined,
				  }
				: {
						outputFormat: "A4",
						outputType: "PdfUrl",
				  };

		const isLocker =
			order?.shipping_address?.metadata
				?.isLocker === true;

		const deliveryMode: DeliveryMode =
			isHomeDelivry
				? {
						mode: DeliveryModemodeEnum.HOM,
						location: "",
				  }
				: {
						mode: isLocker
							? DeliveryModemodeEnum.LOCKER
							: DeliveryModemodeEnum.PR,
						location:
							businessAddress?.returnLocation,
				  };

		const collectionMode: CollectionMode =
			{
				mode: CollectionModemodeEnum.REL,
				location: "",
			};

		const shipmentRequest = {
			context: {
				login: this.client.login,
				password: this.client.password,
				customerId:
					this.client.customerId,
				culture: this.client.culture,
				versionAPI:
					this.client.versionAPI,
			},
			outputOptions,
			shipmentsList: [
				{
					orderNo:
						order?.display_id?.toString(),
					// medusa customer id is too long for mondial relay wich only accept 9 characters
					customerNo: "",
					parcelCount: 1,
					deliveryMode,
					collectionMode,
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title: "",
						firstname:
							order?.shipping_address
								?.first_name ?? "",
						lastname:
							order?.shipping_address
								?.last_name ?? "",
						streetname:
							order?.shipping_address
								?.address_1 ?? "",
						addressAdd2:
							order?.shipping_address
								?.address_2 ?? "",
						countryCode:
							order?.shipping_address
								?.country_code ?? "",
						postCode:
							order?.shipping_address
								?.postal_code ?? "",
						city:
							order?.shipping_address
								?.city ?? "",
						addressAdd1: "",
						mobileNo:
							order?.shipping_address
								?.phone ?? "",
						email: order?.email ?? "",
					},
					recipient: {
						title:
							businessAddress?.title ??
							"",
						firstname:
							businessAddress?.firstname ??
							"",
						lastname:
							businessAddress?.lastname ??
							"",
						streetname:
							businessAddress?.streetname ??
							"",
						addressAdd2:
							businessAddress?.addressAdd2 ??
							"",
						countryCode:
							businessAddress?.countryCode ??
							"",
						postCode:
							businessAddress?.postCode ??
							"",
						city:
							businessAddress?.city ??
							"",
						addressAdd1:
							businessAddress?.addressAdd1 ??
							"",
						mobileNo:
							businessAddress.mobileNo ??
							"",
						email:
							businessAddress.email ??
							"",
					},
				},
			],
		};

		return await this.client.createShipment(
			shipmentRequest
		);
	}

	async validateFulfillmentData(
		optionData: {
			[x: string]: unknown;
		} & PricedShippingOption,
		data: {
			[x: string]: unknown;
		} & ShippingMethod,
		cart: Cart
	): Promise<Record<string, unknown>> {
		return data;
	}

	async validateOption(data: {
		[x: string]: unknown;
	}): Promise<boolean> {
		return true;
	}

	async canCalculate(
		data: Record<string, unknown>
	): Promise<boolean> {
		return false;
	}

	async calculatePrice(
		optionData: {
			[x: string]: unknown;
		},
		data: { [x: string]: unknown },
		cart: Cart
	): Promise<number> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async cancelFulfillment(fulfillment: {
		[x: string]: unknown;
	}): Promise<any> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async getFulfillmentDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async getReturnDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async getShipmentDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async retrieveDocuments(
		fulfillmentData: Record<
			string,
			unknown
		>,
		documentType: "invoice" | "label"
	): Promise<any> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async getFulfillmentOptions(): Promise<
		any[]
	> {
		return [
			{
				id: "mondialrelay-fulfillment",
			},
			{
				id: "mondialrelay-fulfillment-return",
				is_return: true,
			},
		];
	}
}

export default MondialRelayFulfillmentService;

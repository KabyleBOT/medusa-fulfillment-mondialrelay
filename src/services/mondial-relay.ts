import {
	Cart,
	Fulfillment,
	FulfillmentProviderService,
	LineItem,
	Logger,
	MedusaContainer,
	Order,
	OrderService,
	ShippingMethod,
	ShippingOption,
} from "@medusajs/medusa";
import { MedusaError } from "medusa-core-utils";
import { CreateFulfillmentOrder } from "@medusajs/medusa/dist/types/fulfillment";
import { CreateReturnType } from "@medusajs/medusa/dist/types/fulfillment-provider";
import { EntityManager } from "typeorm";
import {
	FulfillmentProviderData,
	MondialRelayOptions,
	OutputOptions,
} from "../types";
import MondialRelayClient from "../utils/mondial-relay-client";

// Define a type that extends MedusaContainer and includes any additional services
export interface InitialInjectedDependencies
	extends Partial<MedusaContainer> {
	logger: Logger;
	manager: EntityManager;
	orderService: OrderService;
}

// InjectedDependencies is now based on InitialInjectedDependencies and adds specific properties of FulfillmentProviderService["container_"]
export type InjectedDependencies =
	InitialInjectedDependencies & {
		[key in keyof FulfillmentProviderService["container_"]]: FulfillmentProviderService["container_"][key];
	};

class MondialRelayFulfillmentService extends FulfillmentProviderService {
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
		super({
			...container,
			...options,
		});

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

	async validateFulfillmentData(
		option: ShippingOption,
		data: Record<string, unknown>,
		cart: Cart | Record<string, unknown>
	): Promise<Record<string, unknown>> {
		return {
			...data,
			shipping_option: option,
			cart,
		};
	}

	async validateOption(
		option: ShippingOption
	): Promise<boolean> {
		return true;
	}

	async canCalculate(
		data: Record<string, unknown>
	): Promise<boolean> {
		return false;
	}

	async calculatePrice(
		option: ShippingOption,
		data: Record<string, unknown>,
		cart?: Order | Cart
	): Promise<number> {
		throw new MedusaError(
			MedusaError.Types.UNEXPECTED_STATE,
			"Method not implemented."
		);
	}

	async createFulfillment(
		method: ShippingMethod,
		items: LineItem[],
		fulfillmentOrder: CreateFulfillmentOrder,
		fulfillment: Fulfillment
	): Promise<FulfillmentProviderData> {
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
			outputOptions: {
				outputFormat: isPrintInStore
					? "QRCode"
					: "A4",
				outputType: isPrintInStore
					? undefined
					: "PdfUrl",
			},
			shipmentsList: [
				{
					orderNo:
						fulfillmentOrder?.display_id?.toString() ??
						"",
					customerNo:
						fulfillmentOrder?.order
							?.customer_id ?? "",
					parcelCount: 1,
					deliveryMode: {
						mode: isHomeDelivry
							? "HOM"
							: "24R",
						location: isHomeDelivry
							? undefined
							: fulfillmentOrder
									?.shipping_address
									?.address_2,
					},
					collectionMode: {
						mode: "REL",
						location: "",
					},
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title:
							businessAddress?.title ??
							"",
						firstName:
							businessAddress?.firstName ??
							"",
						lastName:
							businessAddress?.lastName ??
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
						firstName:
							fulfillmentOrder
								?.shipping_address
								?.first_name ?? "",
						lastName:
							fulfillmentOrder
								?.shipping_address
								?.last_name ?? "",
						streetname:
							fulfillmentOrder
								?.shipping_address
								?.address_1 ?? "",
						addressAdd2:
							fulfillmentOrder
								?.shipping_address
								?.address_2 ?? "",
						countryCode:
							fulfillmentOrder
								?.shipping_address
								?.country_code ?? "",
						postCode:
							fulfillmentOrder
								?.shipping_address
								?.postal_code ?? "",
						city:
							fulfillmentOrder
								?.shipping_address
								.city ?? "",
						addressAdd1: "",
						mobileNo:
							fulfillmentOrder
								?.shipping_address
								?.phone ?? "",
						email:
							fulfillmentOrder?.email ??
							"",
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
			outputOptions: {
				outputFormat: isPrintInStore
					? "QRCode"
					: "A4",
				outputType: isPrintInStore
					? undefined
					: "PdfUrl",
			},
			shipmentsList: [
				{
					orderNo:
						order?.display_id?.toString(),
					customerNo:
						order?.customer_id,
					parcelCount: 1,
					deliveryMode: {
						mode: isHomeDelivry
							? "HOM"
							: "24R",
						location: isHomeDelivry
							? undefined
							: businessAddress?.returnLocation,
					},
					collectionMode: {
						mode: "REL",
						location: undefined,
					},
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title: "",
						firstName:
							order?.shipping_address
								?.first_name ?? "",
						lastName:
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
						firstName:
							businessAddress?.firstName ??
							"",
						lastName:
							businessAddress?.lastName ??
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

	async cancelFulfillment(
		fulfillment: Fulfillment
	): Promise<Fulfillment> {
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
		providerId: string,
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
}

export default MondialRelayFulfillmentService;

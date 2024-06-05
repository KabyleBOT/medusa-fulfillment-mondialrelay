import axios from "axios";
import * as xml2js from "xml2js";
import { Logger } from "@medusajs/medusa";
import {
	Address,
	MondialRelayOptions,
	Parcel,
	ShipmentCreationRequest,
} from "../types/mondial-relay";

class MondialRelayClient {
	apiBaseUrl: string;
	login: string;
	password: string;
	customerId: string;
	culture: string = "fr-FR";
	versionAPI: string = "1.0";
	businessEmail: string;
	businessPhone: string;
	logger: Logger;

	constructor(
		options: MondialRelayOptions,
		logger: Logger
	) {
		if (
			process.env.NODE_ENV ===
			"production"
		) {
			// Code to execute in production environment
			this.apiBaseUrl =
				options.apiBaseUrl as string;
			this.login =
				options.login as string;
			this.password =
				options.password as string;
			this.customerId =
				options.customerId as string;
			this.businessEmail =
				options.businessEmail as string;
			this.businessPhone =
				options.businessPhone as string;
		} else {
			// Code to execute in non-production environment

			this.apiBaseUrl =
				"https://connect-api-sandbox.mondialrelay.com/api/shipment";
			this.login =
				"BDTEST@business-api.mondialrelay.com";
			this.password = `'2crtPDo0ZL7Q*3kLumB`;
			this.customerId = "BDTEST";
			this.businessEmail =
				"test@business.com";
			this.businessPhone = "0606060606";
		}
		this.logger = logger;
	}

	private async sendRequest(
		xmlRequest: string
	): Promise<any> {
		try {
			const response = await axios.post(
				`${this.apiBaseUrl}`,
				xmlRequest,
				{
					headers: {
						Accept: "application/xml",
						"Content-Type": "text/xml",
					},
				}
			);

			if (response.status !== 200) {
				throw new Error(
					"Failed to create shipment"
				);
			}

			const result =
				await xml2js.parseStringPromise(
					response.data
				);

			this.handleMondialRelayErrors(
				result
			);

			return result;
		} catch (error) {
			throw error;
		}
	}

	private handleMondialRelayErrors(
		result: any
	): void {
		const statusList =
			result.ShipmentCreationResponse
				.StatusList[0].Status;
		statusList.forEach(
			(status: any) => {
				const code = status.$.Code;
				const level = status.$.Level;
				const message =
					status.$.Message;

				if (level === "Error") {
					this.logger.error(
						`Status Code: ${code}, Message: ${message}`
					);
					throw new Error(
						`Error from Mondial Relay API: ${message}`
					);
				}
				this.logger.warn(
					`Status Code: ${code}, Message: ${message}`
				);
			}
		);
	}

	private async speekToMondialRelay(
		data: ShipmentCreationRequest
	): Promise<{
		shipment_number: string;
		shipment_label: string;
		shippement_raw_content: Record<
			string,
			unknown
		>;
	}> {
		const {
			context,
			outputOptions,
			shipmentsList,
		} = data;

		const parcelsXML = (
			parcels: Parcel[]
		) =>
			parcels
				.map(
					(parcel) => `
        <Parcel>
          <Content>${parcel.content}</Content>
          <Weight Value="${parcel.weight.value}" Unit="${parcel.weight.unit}"/>
        </Parcel>`
				)
				.join("");

		const addressXML = (
			address: Address
		) => `
      <Address>
        <Streetname>${
					address.streetname
				}</Streetname>
        <AddressAdd2>${
					address.addressAdd2 || ""
				}</AddressAdd2>
        <CountryCode>${address.countryCode.toUpperCase()}</CountryCode>
        <PostCode>${
					address.postCode
				}</PostCode>
        <City>${address.city}</City>
        <AddressAdd1>${
					address.addressAdd1 || ""
				}</AddressAdd1>
        <MobileNo>${
					address.mobileNo || ""
				}</MobileNo>
        <Email>${address.email}</Email>
      </Address>`;

		const shipmentsXML = shipmentsList
			.map(
				(shipment) => `
      <Shipment>
        <OrderNo>${
					shipment.orderNo
				}</OrderNo>
        <CustomerNo>${
					shipment.customerNo
				}</CustomerNo>
        <ParcelCount>${
					shipment.parcelCount
				}</ParcelCount>
        <DeliveryMode Mode="${
					shipment.deliveryMode.mode
				}" Location="${
					shipment.deliveryMode.location
				}"/>
        <CollectionMode Mode="${
					shipment.collectionMode.mode
				}" Location="${
					shipment.collectionMode
						.location
				}"/>
        <Parcels>
          ${parcelsXML(
						shipment.parcels
					)}
        </Parcels>
        <DeliveryInstruction>${
					shipment.deliveryInstruction
				}</DeliveryInstruction>
        <Sender>${addressXML(
					shipment.sender
				)}</Sender>
        <Recipient>${addressXML(
					shipment.recipient
				)}</Recipient>
      </Shipment>`
			)
			.join("");

		const xmlRequest = `
      <ShipmentCreationRequest xmlns="http://www.example.org/Request">
        <Context>
          <Login>${context.login}</Login>
          <Password>${context.password}</Password>
          <CustomerId>${context.customerId}</CustomerId>
          <Culture>${context.culture}</Culture>
          <VersionAPI>${context.versionAPI}</VersionAPI>
        </Context>
        <OutputOptions>
          <OutputFormat>${outputOptions.outputFormat}</OutputFormat>
          <OutputType>${outputOptions.outputType}</OutputType>
        </OutputOptions>
        <ShipmentsList>${shipmentsXML}</ShipmentsList>
      </ShipmentCreationRequest>`;

		const response =
			await this.sendRequest(
				xmlRequest
			);

		const shipmentNumber =
			response?.ShipmentsList?.[0]
				?.Shipment?.[0]?.$
				.ShipmentNumber;
		const shipmentLabel =
			response?.ShipmentsList?.[0]
				?.Shipment?.[0]?.LabelList?.[0]
				?.Label?.[0]?.Output?.[0];
		const shipmentRawContent =
			response?.ShipmentsList?.[0]
				?.Shipment?.[0]?.LabelList?.[0]
				?.Label?.[0]?.RawContent?.[0];

		return {
			shipment_number: shipmentNumber,
			shipment_label: shipmentLabel,
			shippement_raw_content:
				shipmentRawContent,
		};
	}

	async createShipment(
		data: ShipmentCreationRequest
	): Promise<any> {
		const result =
			await this.speekToMondialRelay(
				data
			);
		this.logger.info(
			`Shipment created with number: ${result.shipment_number}`
		);
		return result;
	}
}

export default MondialRelayClient;

# Medusa Fulfillment Mondial Relay Plugin by Assalas Com

## Overview

`medusa-fulfillment-mondialrelay` is a plugin for integrating Mondial Relay shipping services with Medusa.js. This plugin enables seamless creation and management of shipments and returns via the Mondial Relay service.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Requirements](#requirements)
- [License](#license)
- [Contributing](#contributing)

## Installation

To install the plugin, add it to your project dependencies :

```bash

#using Yarn
yarn add medusa-fulfillment-mondialrelay

# or using npm
npm install medusa-fulfillment-mondialrelay

```

## Configuration

To configure the plugin, you need to provide the necessary credentials and options in your Medusa project.

Create or update the medusa-config.js file in your project:

```js
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
	projectConfig: {
		// Other configurations...
	},
	plugins: [
		// Other plugins...
		{
			resolve: `medusa-fulfillment-mondialrelay`,
			options: {
				apiBaseUrl:
					process.env
						.MONDIAL_RELAY_API_BASE_URL,
				culture:
					process.env
						.MONDIAL_RELAY_CULTURE,
				login:
					process.env
						.MONDIAL_RELAY_LOGIN,
				password:
					process.env
						.MONDIAL_RELAY_PASSWORD,
				customerId:
					process.env
						.MONDIAL_RELAY_CUSTOMER_ID,
				businessAddress: {
					title: "Mr", // or "Mme"
					firstName: "John",
					lastName: "Doe",
					streetname: "Rue de la Paix",
					addressAdd2: "Apt 123",
					countryCode: "FR",
					postCode: "75002",
					city: "Paris",
					addressAdd1: "1",
					mobileNo: "0600000000",
					email: "John.Doe@email.com",
					returnLocation: "FR-12345",
				},
			},
		},
	],
};
```

Make sure to add the necessary environment variables to your .env file:

```bash
MONDIAL_RELAY_API_BASE_URL=https://api.mondialrelay.com
MONDIAL_RELAY_CULTURE=fr-FR
MONDIAL_RELAY_LOGIN=your_login
MONDIAL_RELAY_PASSWORD=your_password
MONDIAL_RELAY_CUSTOMER_ID=your_customer_id

```

- The plugin uses the business address for the sender address in outbound/inbound shipments.

- The plugin uses the order shipping address for the customer address in outbound and return shipments.
- The plugin uses address_2 as the pickup point reference, e.g., FR-12345 for both business and customer to indicate the pickup point to Mondial Relay as a workaround.
- The plugin returns :

```json
{
	"shipment_number": "96824834",
	"shipment_label": "https://connect-sandbox.mondialrelay.com//BDTEST/etiquette/GetStickersExpeditionsAnonyme2?ens=BDTEST&expedition=96824834&lg=fr-FR&format=10x15&crc=4C56D4342BDF1F85CA6DAB0409C04666",
	"shippement_raw_content": {
		"string": "unknown"
	}
}
```

- The createFulfillment method returns data that will be stored in fulfillment.data.
- The createReturn method returns data that will be stored in return.shipping_data.

### LOCKER DELIVERY

- The plugin now supports the locker delivery feature. If the shipping address contains isLocker = true, the plugin will return the locker delivery label in the shipment data. .

### New Home Delivry feature

- The plugin now supports the new home delivery feature. The plugin will return the shipment label in the shipment data.

-You need to add type=home in the shipping option metadata created withing the mondialrelay provider.

- If type don't equal to home the default delivry mode of pickup point will be used.

### New print in store feature

- The plugin now supports the new print in store feature. The plugin will return the pickup point reference in the shipment data. The pickup point reference can be used to print the label in the store.

- You need to add print=in_store in the shipping option metadata created withing the mondialrelay provider.

- If print don't equal to in_store the default A4 PDF label will be returned.

```json
{
	"shipment_number": "96824834",
	"shipment_label": "ABCD ...", // Qr code value to be printed in store
	"pickup_point_reference": "FR-12345",
	"shippement_raw_content": {
		"string": "unknown"
	}
}
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

This plugin is in its early development stages. Contributions are welcome! If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

Feel free to contact the author, Khaled Belkouche, at [khaled.belkouche@assalas.com](mailto:khaled.belkouche@assalas.com).

---

For more information about Medusa.js Fulfillment Providers, [refer to the Medusa Fulfillment Provider documentatio](https://docs.medusajs.com/modules/orders/fulfillments).

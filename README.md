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

To install the plugin, add it to your project dependencies using Yarn:

```bash
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
		{
			resolve: `medusa-fulfillment-mondialrelay`,
			options: {
				apiBaseUrl:
					process.env
						.MONDIAL_RELAY_API_BASE_URL,
				login:
					process.env
						.MONDIAL_RELAY_LOGIN,
				password:
					process.env
						.MONDIAL_RELAY_PASSWORD,
				customerId:
					process.env
						.MONDIAL_RELAY_CUSTOMER_ID,
				businessEmail:
					process.env
						.MONDIAL_RELAY_BUSINESS_EMAIL,
				businessPhone:
					process.env
						.MONDIAL_RELAY_BUSINESS_PHONE,
			},
		},
	],
};
```

Make sure to add the necessary environment variables to your .env file:

```bash
MONDIAL_RELAY_API_BASE_URL=https://api.mondialrelay.com
MONDIAL_RELAY_LOGIN=your_login
MONDIAL_RELAY_PASSWORD=your_password
MONDIAL_RELAY_CUSTOMER_ID=your_customer_id
MONDIAL_RELAY_BUSINESS_EMAIL=your_business_email
MONDIAL_RELAY_BUSINESS_PHONE=your_business_phone

```

## Requirements

This plugin requires the Medusa.js Stock Location module. [Please refer to the Stock Location Module documentation for more details](https://docs.medusajs.com/modules/multiwarehouse/stock-location-module).

--

- The address of the stock location is used as the business address.
- The plugin uses the order shipping address for the customer address in outbound and return shipments.
- The plugin uses address_2 as the pickup point reference, e.g., FR-12345 for both business and customer to indicate the pickup point to Mondial Relay as a workaround.
- The plugin returns :

```json
shipment_number: string;
		shipment_label: string;
		shippement_raw_content: Record<
			string,
			unknown
		>;
```

- The createFulfillment method returns data that will be stored in fulfillment.data.
- The createReturn method returns data that will be stored in return.shipping_data.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

This plugin is in its early development stages. Contributions are welcome! If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

Feel free to contact the author, Khaled Belkouche, at [khaled.belkouche@assalas.com](mailto:khaled.belkouche@assalas.com).

---

For more information about Medusa.js Fulfillment Providers, [refer to the Medusa Fulfillment Provider documentatio](https://docs.medusajs.com/modules/orders/fulfillments).

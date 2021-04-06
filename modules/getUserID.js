const fetch = require('node-fetch');
module.exports = {
	getUserID: async (username) => {
		try {
			const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`);
			const data = await response.json();
			if (!data.success) {
				const { errorMessage } = data;
				throw new Error(errorMessage);
			}
			const { Id } = data;
			return Id;
		}
		catch (error) {
			throw (`${error}.`);
		}
	},
};
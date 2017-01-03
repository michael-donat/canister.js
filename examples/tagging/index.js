const canister = require('./../..');

const builder = canister('./wiring.yml', __dirname);

const loggerDefinition = builder.getDefinitionById('logger');

builder.getDefinitionsByTag('logger.transport').forEach(definition => {
	loggerDefinition.addCall(
		canister.Definition.call('addTransport', definition)
	)
})

const container = builder.build();

console.log(container.get('logger'));



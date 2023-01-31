const { request, gql } = require('graphql-request');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

async function getStatus() {
    var response;
    const query = gql`
    {
        status{
            currentStatuses{
                name
                statusCode
            }
        }
    }
    `
    await request('https://api.tarkov.dev/graphql', query).then((data) => response=data)
    return response
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Retrieve server status'),
    async execute(interaction) {
        await interaction.deferReply() //Defer reply incase of API timeout
        response = await getStatus()
        const statusEmbed = new EmbedBuilder()
            .setTitle('Tarkov Server Status')
            .setColor(0x30dd37)
        for (let server in response.status.currentStatuses){ //Loops through all servers and get status
            if(response.status.currentStatuses[server].statusCode != 'OK'){
                statusEmbed.setColor(0xdd3030) //Change color to red if there is one server that is not OK
            }
            statusEmbed.addFields(
                {name: response.status.currentStatuses[server].name, value: `${response.status.currentStatuses[server].statusCode}`}
            )
        }
        await interaction.editReply({embeds: [statusEmbed]})
    }
}

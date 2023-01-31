const { request, gql } = require('graphql-request');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

async function getItem(item) {
    var response;
    const query = gql`
    {
        items(name: "${item}"){
            id
            name
            shortName
            types
            wikiLink
            iconLink
            avg24hPrice
            usedInTasks{
                name
            }
            properties {... on ItemPropertiesAmmo {
                caliber
                damage
                armorDamage
                ricochetChance
                penetrationChance
            }}
        }
    }
    `
    await request('https://api.tarkov.dev/graphql', query).then((data) => response=data)
    return response
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Retrieve item information')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item to search')
                .setRequired(true)),
    async execute(interaction) {
        const item = interaction.options.getString('item')
        await interaction.deferReply() //Defer response incase of API timeout
        response = await getItem(item)
        if(response.items.length > 0){ //Make sure that response isn't empty
            if(response.items.length > 1){
                for(items in response.items){
                    if(!response.items[items].types.includes('ammo')){
                        response.items.splice(items, 1)
                    }
                }
            }
    
            const itemEmbed = new EmbedBuilder()
                .setTitle(`Information for ${item}`)
                .setURL(`${response.items[0].wikiLink}`)
                .setThumbnail(`${response.items[0].iconLink}`)
                .setColor(0x5DA9E9)
                .setFooter({text: 'Tarkov bot developed by Pappysox#0001'})
            
            //Checks if item can be sold on flea
            if(response.items[0].types.includes('noFlea')){
                itemEmbed.addFields({ name: 'Avg 24hr price', value: `Item not available on flea`})
            } else {
                itemEmbed.addFields({ name: 'Avg 24hr price', value: `${response.items[0].avg24hPrice} roubles`})
            }
            
            //Checks if the item is used in any tasks
            if(response.items[0].usedInTasks.length > 0){
                usedInTasks = ""
                for(task in response.items[0].usedInTasks){
                    usedInTasks = usedInTasks.concat(response.items[0].usedInTasks[task].name)
                }
                console.log(usedInTasks)
                itemEmbed.addFields({name: 'Used in', value: `${usedInTasks}`})
            } else{
                itemEmbed.addFields({name: 'Used in', value: 'No tasks'})
            }

            //Checks if item is ammo
            if(response.items[0].types.includes('ammo')){
                itemEmbed.addFields(
                    {name: 'Damage', value: `${response.items[0].properties.damage}`, inline: true},
                    {name: 'Armor Damage', value: `${response.items[0].properties.armorDamage}`, inline: true},
                    {name: 'Ricochet Chance', value: `${response.items[0].properties.ricochetChance}`, inline: true},
                    {name: 'Penetration Chance', value: `${response.items[0].properties.penetrationChance}`, inline: true}
                )
            }
            await interaction.editReply({embeds: [itemEmbed]})
        } else{
            await interaction.editReply(`Unable to find ${item}`)
        }
    }
}

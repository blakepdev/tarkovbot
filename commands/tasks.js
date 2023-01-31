const { request, gql } = require('graphql-request');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

let rawtaskList = fs.readFileSync(__dirname + '/../tasks.json');
let taskList = JSON.parse(rawtaskList);

async function getTask(task) {
    var response;
    const query = gql`
    {
        task(id: "${task}"){
        name
        trader{
          name
        }
        map{
          name
        }
        wikiLink
        minPlayerLevel
        neededKeys{
          keys{
            name
            avg24hPrice
          }
        }
        taskRequirements{
          task {
            name
          }
        }
        objectives{
          description
        }
      }
    }
    `
    await request('https://api.tarkov.dev/graphql', query).then((data) => response=data)
    return response
}

function getTaskID(task) {
    return taskList.filter(function(taskList) {
        return taskList.name.toLowerCase() == task.toLowerCase()
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task')
        .setDescription('Retrieve task information')
        .addStringOption(option => 
            option.setName('task')
                .setDescription('Task to search')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply() //Defer reply incase of API timeout
        task = interaction.options.getString('task')
        taskID = getTaskID(task)
        if(taskID.length < 1){
            await interaction.editReply(`Unable to find ${task}`)
            return
        }
        response = await getTask(taskID[0].id)
        console.log(response)
        const taskEmbed = new EmbedBuilder()
            .setTitle('Tarkov Task Checker')
            .setColor(0x5DA9E9)
            .setURL(`${response.task.wikiLink}`)
            .addFields(
                {name: 'Task', value: `${response.task.name}`, inline: true},
                {name: 'Trader', value: `${response.task.trader.name}`, inline: true},
                {name: 'Player Level', value: `${response.task.minPlayerLevel}`},
            )
            .setFooter({text: 'Tarkov bot developed by Pappysox#0001'})
        
        if(response.task.neededKeys.length > 0){
            keysNeeded = ""
            for(keys in response.task.neededKeys){
                keysNeeded = keysNeeded.concat("\n", response.task.neededKeys[keys].keys[0].name)
            }
            taskEmbed.addFields({name:'Keys', value:`${keysNeeded}`, inline: true})
        } else {
            taskEmbed.addFields({name: 'Keys', value: 'No keys needed', inline: true})
        }

        if(response.task.taskRequirements.length > 0){
            tasksNeeded = ""
            for(tasks in response.task.taskRequirements){
                tasksNeeded = tasksNeeded.concat("\n", response.task.taskRequirements[tasks].task.name)
            }
            taskEmbed.addFields({name:'Required Tasks', value:`${tasksNeeded}`, inline: true})
        } else {
            taskEmbed.addFields({name:'Required Tasks', value:'No tasks required', inline: true})
        }

        if(response.task.objectives.length > 0){
            objectives = ""
            for(objective in response.task.objectives){
                objectives = objectives.concat("\n", `${objective}. ${response.task.objectives[objective].description}`)
            }
            taskEmbed.addFields({name: 'Objectives', value: `${objectives}`})
        } else {
            taskEmbed.addFields({name: 'Objectives', value: 'There are no objectives'})
        }
        await interaction.editReply({embeds: [taskEmbed]})
    }
}

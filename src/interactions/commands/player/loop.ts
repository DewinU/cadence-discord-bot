import { GuildQueue, QueueRepeatMode, useQueue } from 'discord-player';
import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { BaseSlashCommandInteraction } from '../../../classes/interactions';
import { BaseSlashCommandParams, BaseSlashCommandReturnType } from '../../../types/interactionTypes';
import { checkQueueExists } from '../../../utils/validation/queueValidator';
import { checkInVoiceChannel, checkSameVoiceChannel } from '../../../utils/validation/voiceChannelValidator';

class LoopCommand extends BaseSlashCommandInteraction {
    constructor() {
        const data = new SlashCommandBuilder()
            .setName('loop')
            .setDescription('Toggle looping a track, the whole queue or autoplay.')
            .addStringOption(() =>
                new SlashCommandStringOption()
                    .setName('mode')
                    .setDescription('Loop mode: Track, queue, autoplay or disabled.')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Track', value: '1' },
                        { name: 'Queue', value: '2' },
                        { name: 'Autoplay', value: '3' },
                        { name: 'Disabled', value: '0' }
                    )
            );
        super(data);

        this.validators = [
            (args) => checkInVoiceChannel(args),
            (args) => checkSameVoiceChannel(args),
            (args) => checkQueueExists(args)
        ];
    }

    async execute(params: BaseSlashCommandParams): BaseSlashCommandReturnType {
        const { executionId, interaction } = params;
        const logger = this.getLogger(this.name, executionId, interaction);

        const queue: GuildQueue = useQueue(interaction.guild!.id)!;

        await this.runValidators({ interaction, queue, executionId });

        // TODO: create type for loop modes formatted
        const loopModesFormatted: Map<number, string> = new Map([
            [0, 'disabled'],
            [1, 'track'],
            [2, 'queue'],
            [3, 'autoplay']
        ]);

        const mode: number = parseInt(interaction.options.getString('mode')!);
        const modeUserString: string = loopModesFormatted.get(mode)!;
        const currentMode: QueueRepeatMode = queue.repeatMode;
        const currentModeUserString: string = loopModesFormatted.get(currentMode)!;

        if (!mode && mode !== 0) {
            logger.debug('No mode input was provided, responding with current loop mode.');

            logger.debug('Responding with info embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**${
                                currentMode === 3 ? this.embedOptions.icons.autoplay : this.embedOptions.icons.loop
                            } Current loop mode**\nThe looping mode is currently set to **\`${currentModeUserString}\`**.`
                        )
                        .setColor(this.embedOptions.colors.info)
                ]
            });
        }

        if (mode === currentMode) {
            logger.debug(`Loop mode is already set to ${modeUserString}.`);

            logger.debug('Responding with warning embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**${this.embedOptions.icons.warning} Oops!**\nLoop mode is already **\`${modeUserString}\`**.`
                        )
                        .setColor(this.embedOptions.colors.warning)
                ]
            });
        }

        queue.setRepeatMode(mode);

        // switch(queue.repeatMode) instead of multiple if statements

        if (queue.repeatMode !== mode) {
            logger.warn(
                'Failed to change loop mode. After setting queue repeat mode, the value was not the same as input.'
            );

            logger.debug('Responding with error embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `**${this.embedOptions.icons.error} Uh-oh... Failed to change loop mode!**\nI tried to change the loop mode to **\`${modeUserString}\`**, but something went wrong.\n\nYou can try to perform the command again.\n\n_If you think this message is incorrect or the issue persists, please submit a bug report in the **[support server](${this.botOptions.serverInviteUrl})**._`
                        )
                        .setColor(this.embedOptions.colors.error)
                        .setFooter({ text: `Execution ID: ${executionId}` })
                ]
            });
        }

        if (queue.repeatMode === 0) {
            logger.debug('Disabled loop mode.');

            // TODO: Different text when disabling autoplay.
            logger.debug('Responding with success embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor(await this.getEmbedUserAuthor(interaction))
                        .setDescription(
                            `**${this.embedOptions.icons.success} Loop mode disabled**\nChanging loop mode from **\`${currentModeUserString}\`** to **\`${modeUserString}\`**.\n\nThe ${currentModeUserString} will no longer play on repeat!`
                        )
                        .setColor(this.embedOptions.colors.success)
                ]
            });
        }

        if (queue.repeatMode === 3) {
            logger.debug('Enabled autoplay mode.');

            logger.debug('Responding with success embed.');
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor(await this.getEmbedUserAuthor(interaction))
                        .setDescription(
                            `**${this.embedOptions.icons.autoplaying} Loop mode changed**\nChanging loop mode from **\`${currentModeUserString}\`** to **\`${modeUserString}\`**.\n\nWhen the queue is empty, similar tracks will start playing!`
                        )
                        .setColor(this.embedOptions.colors.success)
                ]
            });
        }

        logger.debug('Enabled loop mode.');

        logger.debug('Responding with success embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor(await this.getEmbedUserAuthor(interaction))
                    .setDescription(
                        `**${this.embedOptions.icons.looping} Loop mode changed**\nChanging loop mode from **\`${currentModeUserString}\`** to **\`${modeUserString}\`**.\n\nThe ${modeUserString} will now play on repeat!`
                    )
                    .setColor(this.embedOptions.colors.success)
            ]
        });
    }
}

export default new LoopCommand();

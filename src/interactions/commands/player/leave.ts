import { GuildQueue, useQueue } from 'discord-player';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { BaseSlashCommandInteraction } from '../../../classes/interactions';
import { BaseSlashCommandParams, BaseSlashCommandReturnType } from '../../../types/interactionTypes';
import { checkQueueExists } from '../../../utils/validation/queueValidator';
import { checkInVoiceChannel, checkSameVoiceChannel } from '../../../utils/validation/voiceChannelValidator';

class LeaveCommand extends BaseSlashCommandInteraction {
    constructor() {
        const data = new SlashCommandBuilder()
            .setName('leave')
            .setDescription('Clear the queue and remove bot from voice channel.');
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

        logger.info('Validators passed, clearing queue.');

        logger.debug('Deleting queue.');
        await this.deleteQueue(queue);

        logger.debug('Responding with success embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor(await this.getEmbedUserAuthor(interaction))
                    .setDescription(
                        `**${this.embedOptions.icons.success} Leaving channel**\nCleared the track queue and left voice channel.\n\nTo play more music, use the **\`/play\`** command!`
                    )
                    .setColor(this.embedOptions.colors.success)
            ]
        });
    }

    private async deleteQueue(queue: GuildQueue): Promise<void> {
        if (!queue.deleted) {
            queue.delete();
        }
    }
}

export default new LeaveCommand();

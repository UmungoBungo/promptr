import { Configuration, OpenAIApi } from "openai"
import { FileService } from "./fileService.js"
import ConfigService from "./configService.js"

export default class RefactorService {
  static async call(prompt, filePath, shouldLog = false) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)
    const config = await ConfigService.retrieveConfig();
    const response = await openai.createCompletion({
      ...config,
      prompt: prompt,
      max_tokens: (4096 - (prompt.split(" ").length * 2)),
    })

    if (shouldLog) {
      this.log(`Response received: \n`)
      this.log(response)
      this.log(`Choices:`)
      this.log(response?.data?.choices)
    }
    if (!response?.data?.choices) return null
    let result = response.data.choices
      .map((d) => d?.text?.trim())
      .join()
    if (shouldLog) {
      this.log(`joined choices: ${result}`)
    }
    const output = this.extractSourceCode(result)
    await FileService.write(output, filePath)
    return output
  }

  static extractSourceCode(input) {
    const lines = input.split("\n")
    if (lines.length > 0 && lines[0].startsWith("Updated source code:")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("// Your code")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[0].startsWith("-------")) {
      lines.shift()
    }
    return lines.join("\n")
  }

  static async getPreamble(preamblePath) {
    try {
      // Use the fs module to read the file
      const preamble = await fs.promises.readFile(preamblePath, "utf-8")
      return preamble
    } catch (err) {
      this.log(err)
    }
  }

  static log(message) {
    console.log(message)
  }

}